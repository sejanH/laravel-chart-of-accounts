<?php

namespace Sejan\Finance\Http\Controllers;

use Sejan\Finance\Models\Voucher;
use Sejan\Finance\Models\VoucherAccount;
use Sejan\Finance\Models\VoucherLine;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controller;

class VoucherWorkflowController extends Controller
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
        $selectedId = $request->integer('selected');

        $vouchers = Voucher::query()
            ->with(['lines.account', 'createdBy'])
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->limit(50)
            ->get();

        $selectedVoucher = $vouchers->firstWhere('id', $selectedId) ?: $vouchers->first();

        $pendingVouchers = $vouchers
            ->where('status', 'draft')
            ->take(10)
            ->values()
            ->map(fn (Voucher $voucher) => $this->mapVoucherListRow($voucher));

        $voucherList = $vouchers
            ->take(20)
            ->values()
            ->map(fn (Voucher $voucher) => $this->mapVoucherListRow($voucher));

        $detailsRows = collect();
        $previousId = null;
        $nextId = null;

        if ($selectedVoucher) {
            $detailsRows = $selectedVoucher->lines->map(function (VoucherLine $line) {
                return [
                    'id' => $line->id,
                    'row_no' => $line->row_no,
                    'account_no' => $line->account?->code,
                    'description' => $line->description,
                    'sub_account' => $line->sub_account_code,
                    'sub_description' => $line->sub_account_description,
                    'debit' => (float) $line->debit,
                    'credit' => (float) $line->credit,
                ];
            })->values();

            $previousId = Voucher::query()
                ->where('id', '>', $selectedVoucher->id)
                ->orderBy('id')
                ->value('id');

            $nextId = Voucher::query()
                ->where('id', '<', $selectedVoucher->id)
                ->orderByDesc('id')
                ->value('id');
        }

        return Inertia::render('Finance/Voucher/VoucherEntry', [
            'voucherTypes' => collect(self::VOUCHER_TYPES)->map(function (array $type) {
                return [
                    ...$type,
                    'next' => $this->nextVoucherNo($type['value'], now()->toDateString()),
                ];
            })->values(),
            'selectedVoucher' => $selectedVoucher ? $this->mapVoucherForHeader($selectedVoucher) : null,
            'voucherDetails' => $detailsRows,
            'voucherList' => $voucherList,
            'pendingVouchers' => $pendingVouchers,
            'navigation' => [
                'previous_id' => $previousId,
                'next_id' => $nextId,
            ],
            'can' => [
                'manage' => $request->user()->can('finance.manage'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'voucher_type' => ['required', Rule::in(collect(self::VOUCHER_TYPES)->pluck('value')->all())],
            'voucher_no' => ['nullable', 'string', 'max:40', Rule::unique('vouchers', 'voucher_no')],
            'entry_date' => ['required', 'date'],
            'financial_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'period' => ['nullable', 'string', 'max:20'],
            'reference' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'payment_type' => ['nullable', 'string', 'max:30'],
            'cheque_bank_name' => ['nullable', 'string', 'max:150'],
            'cheque_no' => ['nullable', 'string', 'max:100'],
            'cheque_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['draft', 'completed', 'cancelled'])],
        ]);

        $voucher = Voucher::create([
            'voucher_no' => $validated['voucher_no'] ?: $this->nextVoucherNo($validated['voucher_type'], $validated['entry_date']),
            'voucher_type' => $validated['voucher_type'],
            'entry_date' => $validated['entry_date'],
            'financial_year' => $validated['financial_year'] ?? (int) date('Y', strtotime($validated['entry_date'])),
            'period' => $validated['period'] ?? (string) date('m', strtotime($validated['entry_date'])),
            'reference' => $validated['reference'] ?? null,
            'description' => $validated['description'] ?? null,
            'payment_type' => $validated['payment_type'] ?? null,
            'cheque_bank_name' => $validated['cheque_bank_name'] ?? null,
            'cheque_no' => $validated['cheque_no'] ?? null,
            'cheque_date' => $validated['cheque_date'] ?? null,
            'status' => $validated['status'] ?? 'draft',
            'total_debit' => 0,
            'total_credit' => 0,
            'created_by' => $request->user()->id,
            'approved_by' => null,
        ]);

        return redirect()
            ->route('finance.v2.vouchers.index', ['selected' => $voucher->id])
            ->with('success', 'V2 voucher header saved. Now add voucher details.');
    }

    public function update(Request $request, Voucher $voucher): RedirectResponse
    {
        $validated = $request->validate([
            'voucher_type' => ['required', Rule::in(collect(self::VOUCHER_TYPES)->pluck('value')->all())],
            'entry_date' => ['required', 'date'],
            'financial_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'period' => ['nullable', 'string', 'max:20'],
            'reference' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'payment_type' => ['nullable', 'string', 'max:30'],
            'cheque_bank_name' => ['nullable', 'string', 'max:150'],
            'cheque_no' => ['nullable', 'string', 'max:100'],
            'cheque_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['draft', 'completed', 'cancelled'])],
        ]);

        $voucher->update([
            'voucher_type' => $validated['voucher_type'],
            'entry_date' => $validated['entry_date'],
            'financial_year' => $validated['financial_year'] ?? (int) date('Y', strtotime($validated['entry_date'])),
            'period' => $validated['period'] ?? (string) date('m', strtotime($validated['entry_date'])),
            'reference' => $validated['reference'] ?? null,
            'description' => $validated['description'] ?? null,
            'payment_type' => $validated['payment_type'] ?? null,
            'cheque_bank_name' => $validated['cheque_bank_name'] ?? null,
            'cheque_no' => $validated['cheque_no'] ?? null,
            'cheque_date' => $validated['cheque_date'] ?? null,
            'status' => $validated['status'] ?? 'draft',
        ]);

        return redirect()
            ->route('finance.v2.vouchers.index', ['selected' => $voucher->id])
            ->with('success', 'V2 voucher header updated.');
    }

    public function destroy(Voucher $voucher): RedirectResponse
    {
        $voucher->delete();

        return redirect()
            ->route('finance.v2.vouchers.index')
            ->with('success', 'V2 voucher deleted.');
    }

    public function details(Voucher $voucher): Response
    {
        $voucher->load(['lines.account', 'createdBy']);

        $accounts = VoucherAccount::query()
            ->where('is_active', true)
            ->orderBy('code')
            ->get()
            ->map(fn (VoucherAccount $account) => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'label' => $account->code.' - '.$account->name,
                'type' => $account->type,
            ]);

        return Inertia::render('Finance/Voucher/VoucherDetailsEntry', [
            'voucher' => $this->mapVoucherForHeader($voucher),
            'lines' => $voucher->lines
                ->sortBy('row_no')
                ->values()
                ->map(fn (VoucherLine $line) => [
                    'id' => $line->id,
                    'row_no' => $line->row_no,
                    'voucher_account_id' => $line->voucher_account_id,
                    'account_no' => $line->account?->code,
                    'account_name' => $line->account?->name,
                    'description' => $line->description,
                    'amount' => (float) ($line->entry_side === 'credit' ? $line->credit : $line->debit),
                    'entry_side' => $line->entry_side ?? ((float) $line->credit > 0 ? 'credit' : 'debit'),
                    'remarks' => $line->remarks,
                    'account_source' => $line->account_source,
                    'sub_account_code' => $line->sub_account_code,
                    'sub_account_description' => $line->sub_account_description,
                ]),
            'accounts' => $accounts,
            'can' => [
                'manage' => request()->user()->can('finance.manage'),
            ],
        ]);
    }

    public function storeLine(Request $request, Voucher $voucher): RedirectResponse
    {
        $validated = $request->validate([
            'voucher_account_id' => ['required', 'exists:voucher_accounts,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'entry_side' => ['required', Rule::in(['debit', 'credit'])],
            'remarks' => ['nullable', 'string', 'max:255'],
            'account_source' => ['nullable', 'string', 'max:40'],
            'sub_account_code' => ['nullable', 'string', 'max:80'],
            'sub_account_description' => ['nullable', 'string', 'max:255'],
        ]);

        $nextRow = ((int) $voucher->lines()->max('row_no')) + 1;

        $voucher->lines()->create([
            'row_no' => $nextRow,
            'voucher_account_id' => $validated['voucher_account_id'],
            'description' => $validated['description'] ?? null,
            'debit' => $validated['entry_side'] === 'debit' ? (float) $validated['amount'] : 0,
            'credit' => $validated['entry_side'] === 'credit' ? (float) $validated['amount'] : 0,
            'entry_side' => $validated['entry_side'],
            'remarks' => $validated['remarks'] ?? null,
            'account_source' => $validated['account_source'] ?? null,
            'sub_account_code' => $validated['sub_account_code'] ?? null,
            'sub_account_description' => $validated['sub_account_description'] ?? null,
        ]);

        $this->recalculateTotals($voucher);

        return redirect()
            ->route('finance.v2.vouchers.details', $voucher->id)
            ->with('success', 'Voucher detail added.');
    }

    public function updateLine(Request $request, Voucher $voucher, VoucherLine $voucherLine): RedirectResponse
    {
        abort_unless($voucherLine->voucher_id === $voucher->id, 404);

        $validated = $request->validate([
            'voucher_account_id' => ['required', 'exists:voucher_accounts,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'entry_side' => ['required', Rule::in(['debit', 'credit'])],
            'remarks' => ['nullable', 'string', 'max:255'],
            'account_source' => ['nullable', 'string', 'max:40'],
            'sub_account_code' => ['nullable', 'string', 'max:80'],
            'sub_account_description' => ['nullable', 'string', 'max:255'],
        ]);

        $voucherLine->update([
            'voucher_account_id' => $validated['voucher_account_id'],
            'description' => $validated['description'] ?? null,
            'debit' => $validated['entry_side'] === 'debit' ? (float) $validated['amount'] : 0,
            'credit' => $validated['entry_side'] === 'credit' ? (float) $validated['amount'] : 0,
            'entry_side' => $validated['entry_side'],
            'remarks' => $validated['remarks'] ?? null,
            'account_source' => $validated['account_source'] ?? null,
            'sub_account_code' => $validated['sub_account_code'] ?? null,
            'sub_account_description' => $validated['sub_account_description'] ?? null,
        ]);

        $this->recalculateTotals($voucher);

        return redirect()
            ->route('finance.v2.vouchers.details', $voucher->id)
            ->with('success', 'Voucher detail updated.');
    }

    public function destroyLine(Voucher $voucher, VoucherLine $voucherLine): RedirectResponse
    {
        abort_unless($voucherLine->voucher_id === $voucher->id, 404);

        DB::transaction(function () use ($voucher, $voucherLine) {
            $voucherLine->delete();

            $remaining = $voucher->lines()->orderBy('row_no')->get();
            foreach ($remaining as $index => $line) {
                $line->update(['row_no' => $index + 1]);
            }

            $this->recalculateTotals($voucher);
        });

        return redirect()
            ->route('finance.v2.vouchers.details', $voucher->id)
            ->with('success', 'Voucher detail deleted.');
    }

    private function mapVoucherForHeader(Voucher $voucher): array
    {
        return [
            'id' => $voucher->id,
            'voucher_no' => $voucher->voucher_no,
            'voucher_type' => $voucher->voucher_type,
            'entry_date' => optional($voucher->entry_date)->toDateString(),
            'financial_year' => $voucher->financial_year,
            'period' => $voucher->period,
            'reference' => $voucher->reference,
            'description' => $voucher->description,
            'payment_type' => $voucher->payment_type,
            'cheque_bank_name' => $voucher->cheque_bank_name,
            'cheque_no' => $voucher->cheque_no,
            'cheque_date' => optional($voucher->cheque_date)->toDateString(),
            'status' => $voucher->status,
            'status_label' => $voucher->status === 'draft' ? 'Pending' : ucfirst($voucher->status),
            'total_debit' => (float) $voucher->total_debit,
            'total_credit' => (float) $voucher->total_credit,
            'created_by_name' => $voucher->createdBy?->name,
            'updated_at' => optional($voucher->updated_at)?->toDateTimeString(),
            'details_url' => route('finance.v2.vouchers.details', $voucher->id),
            'print_url' => route('finance.v2.vouchers.print', $voucher->id),
            'pdf_url' => route('finance.v2.vouchers.pdf', $voucher->id),
        ];
    }

    private function mapVoucherListRow(Voucher $voucher): array
    {
        return [
            'id' => $voucher->id,
            'voucher_no' => $voucher->voucher_no,
            'entry_date' => optional($voucher->entry_date)->toDateString(),
            'description' => $voucher->description,
            'reference' => $voucher->reference,
            'status' => $voucher->status,
        ];
    }

    private function nextVoucherNo(string $voucherType, string $entryDate): string
    {
        $period = date('Ym', strtotime($entryDate));
        $prefix = $voucherType.'-'.$period.'-';

        $last = Voucher::query()
            ->where('voucher_no', 'like', $prefix.'%')
            ->latest('id')
            ->value('voucher_no');

        $sequence = 1;

        if (is_string($last) && preg_match('/'.preg_quote($prefix, '/').'([0-9]{4})$/', $last, $matches) === 1) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('%s%04d', $prefix, $sequence);
    }

    private function recalculateTotals(Voucher $voucher): void
    {
        $totals = $voucher->lines()
            ->selectRaw('COALESCE(SUM(debit), 0) as debit_sum, COALESCE(SUM(credit), 0) as credit_sum')
            ->first();

        $voucher->update([
            'total_debit' => (float) ($totals->debit_sum ?? 0),
            'total_credit' => (float) ($totals->credit_sum ?? 0),
        ]);
    }
}
