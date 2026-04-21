<?php

namespace Sejan\Finance\Http\Controllers;

use Sejan\Finance\Enums\JournalEntryStatus;
use Sejan\Finance\Models\Account;
use App\Models\Employee;
use Sejan\Finance\Models\JournalEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controller;

class VoucherEntryController extends Controller
{
    private const VOUCHER_TYPES = [
        ['value' => 'BPV', 'label' => 'Bank Payment Voucher'],
        ['value' => 'BRV', 'label' => 'Bank Receipt Voucher'],
        ['value' => 'CPV', 'label' => 'Cash Payment Voucher'],
        ['value' => 'CRV', 'label' => 'Cash Receipt Voucher'],
        ['value' => 'JV', 'label' => 'Journal Voucher'],
    ];

    public function index(Request $request): Response
    {
        $accountOptions = Account::query()
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name'])
            ->map(fn (Account $account) => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'label' => $account->code.' - '.$account->name,
            ]);

        $employees = Employee::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'name' => trim($employee->name),
            ]);

        $voucherTypes = collect(self::VOUCHER_TYPES)->map(function (array $voucherType) {
            $prefix = $voucherType['value'];

            return [
                ...$voucherType,
                'next_reference' => $this->nextReference($prefix),
            ];
        })->values();

        $vouchers = JournalEntry::query()
            ->with(['lines.account', 'preparedBy'])
            ->where('source_type', 'voucher')
            ->latest('entry_date')
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(function (JournalEntry $entry) {
                return [
                    'id' => $entry->id,
                    'reference' => $entry->reference,
                    'title' => $entry->title,
                    'entry_date' => optional($entry->entry_date)->toDateString(),
                    'status' => $entry->status->value,
                    'total_debit' => (float) $entry->total_debit,
                    'total_credit' => (float) $entry->total_credit,
                    'prepared_by' => $entry->preparedBy ? trim($entry->preparedBy->first_name.' '.$entry->preparedBy->last_name) : null,
                    'lines' => $entry->lines->map(fn ($line) => [
                        'id' => $line->id,
                        'account' => $line->account ? [
                            'code' => $line->account->code,
                            'name' => $line->account->name,
                        ] : null,
                        'description' => $line->description,
                        'debit' => (float) $line->debit,
                        'credit' => (float) $line->credit,
                    ]),
                ];
            });

        return Inertia::render('Finance/VoucherEntry', [
            'accountOptions' => $accountOptions,
            'employees' => $employees,
            'voucherTypes' => $voucherTypes,
            'vouchers' => $vouchers,
            'can' => [
                'manage' => $request->user()->can('finance.manage'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'voucher_type' => ['required', Rule::in(collect(self::VOUCHER_TYPES)->pluck('value')->all())],
            'reference' => ['required', 'string', 'max:100', Rule::unique('journal_entries', 'reference')],
            'entry_date' => ['required', 'date'],
            'title' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::enum(JournalEntryStatus::class)],
            'prepared_by_employee_id' => ['nullable', 'exists:employees,id'],
            'approved_by_employee_id' => ['nullable', 'exists:employees,id'],
            'notes' => ['nullable', 'string'],
            'lines' => ['required', 'array', 'min:2'],
            'lines.*.account_id' => ['required', 'exists:accounts,id'],
            'lines.*.description' => ['nullable', 'string', 'max:255'],
            'lines.*.debit' => ['nullable', 'numeric', 'min:0'],
            'lines.*.credit' => ['nullable', 'numeric', 'min:0'],
        ]);

        $lines = $validated['lines'];
        unset($validated['lines']);

        DB::transaction(function () use ($validated, $lines) {
            $debitSum = 0.0;
            $creditSum = 0.0;

            foreach ($lines as $line) {
                $debit = (float) ($line['debit'] ?? 0);
                $credit = (float) ($line['credit'] ?? 0);

                if ($debit === 0.0 && $credit === 0.0) {
                    throw ValidationException::withMessages([
                        'lines' => 'Each voucher row must include a debit or credit amount.',
                    ]);
                }

                $debitSum += $debit;
                $creditSum += $credit;
            }

            if (abs($debitSum - $creditSum) > 0.01) {
                throw ValidationException::withMessages([
                    'lines' => 'Voucher is not balanced. Total debit must equal total credit.',
                ]);
            }

            $entry = JournalEntry::create([
                'reference' => $validated['reference'],
                'title' => $validated['title'] ?: ($validated['voucher_type'].' Voucher'),
                'entry_date' => $validated['entry_date'],
                'status' => $validated['status'] ?? JournalEntryStatus::DRAFT,
                'source_type' => 'voucher',
                'source_id' => null,
                'prepared_by_employee_id' => $validated['prepared_by_employee_id'] ?? null,
                'approved_by_employee_id' => $validated['approved_by_employee_id'] ?? null,
                'total_debit' => $debitSum,
                'total_credit' => $creditSum,
                'notes' => $validated['notes'] ?? null,
                'posted_at' => ($validated['status'] ?? null) === JournalEntryStatus::POSTED->value ? now() : null,
            ]);

            foreach ($lines as $line) {
                $entry->lines()->create([
                    'account_id' => $line['account_id'],
                    'description' => $line['description'] ?? null,
                    'debit' => (float) ($line['debit'] ?? 0),
                    'credit' => (float) ($line['credit'] ?? 0),
                ]);
            }
        });

        return redirect()
            ->route('finance.vouchers.index')
            ->with('success', 'Voucher recorded successfully.');
    }

    private function nextReference(string $prefix): string
    {
        $latest = JournalEntry::query()
            ->where('reference', 'like', $prefix.'-%')
            ->latest('id')
            ->value('reference');

        $nextNumber = 1;

        if (is_string($latest) && preg_match('/^'.preg_quote($prefix, '/').'-(\d+)$/', $latest, $matches) === 1) {
            $nextNumber = ((int) $matches[1]) + 1;
        }

        return sprintf('%s-%06d', $prefix, $nextNumber);
    }
}
