<?php

namespace Sejan\Finance\Http\Controllers;

use Sejan\Finance\Enums\JournalEntryStatus;
use Sejan\Finance\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Routing\Controller;
class JournalEntryController extends Controller
{
    public function index(): JsonResponse
    {
        $userModel = Config::get('finance.user_model');
        $userModelInstance = new $userModel;
        $userTable = $userModelInstance->getTable();

        $entries = JournalEntry::query()
            ->with(['lines.account', 'preparedBy', 'approvedBy'])
            ->latest('entry_date')
            ->paginate();

        return response()->json($entries);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validateEntry($request);
        $lines = $payload['lines'] ?? [];
        unset($payload['lines']);

        $entry = DB::transaction(function () use ($payload, $lines) {
            $entry = JournalEntry::create($this->prepareEntryData($payload));
            $this->syncLines($entry, $lines);

            return $entry;
        });

        return response()->json($entry->fresh()->load(['lines.account', 'preparedBy', 'approvedBy']), 201);
    }

    public function show(JournalEntry $journalEntry): JsonResponse
    {
        $journalEntry->load(['lines.account', 'lines.customer', 'preparedBy', 'approvedBy']);

        return response()->json($journalEntry);
    }

    public function update(Request $request, JournalEntry $journalEntry): JsonResponse
    {
        $payload = $this->validateEntry($request, $journalEntry);
        $lines = $payload['lines'] ?? null;
        unset($payload['lines']);

        $journalEntry = DB::transaction(function () use ($journalEntry, $payload, $lines) {
            $journalEntry->update($this->prepareEntryData($payload, $journalEntry));
            if (is_array($lines)) {
                $this->syncLines($journalEntry, $lines);
            } else {
                $this->recalculateTotals($journalEntry);
            }

            return $journalEntry;
        });

        return response()->json($journalEntry->fresh()->load(['lines.account', 'preparedBy', 'approvedBy']));
    }

    public function destroy(JournalEntry $journalEntry): JsonResponse
    {
        $journalEntry->delete();

        return response()->json(null, 204);
    }

    private function validateEntry(Request $request, ?JournalEntry $journalEntry = null): array
    {
        $userTable = Config::get('finance.user_table', 'users');

        return $request->validate([
            'reference' => [
                'required',
                'string',
                'max:100',
                Rule::unique('journal_entries', 'reference')->ignore($journalEntry),
            ],
            'title' => ['nullable', 'string', 'max:255'],
            'entry_date' => ['required', 'date'],
            'status' => ['nullable', Rule::enum(JournalEntryStatus::class)],
            'source_type' => ['nullable', 'string', 'max:255'],
            'source_id' => ['nullable', 'integer'],
            'prepared_by_employee_id' => ['nullable', "exists:{$userTable},id"],
            'approved_by_employee_id' => ['nullable', "exists:{$userTable},id"],
            'posted_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'lines' => ['sometimes', 'array', 'min:1'],
            'lines.*.account_id' => ['required', 'exists:accounts,id'],
            'lines.*.description' => ['nullable', 'string', 'max:255'],
            'lines.*.debit' => ['nullable', 'numeric', 'min:0'],
            'lines.*.credit' => ['nullable', 'numeric', 'min:0'],
            'lines.*.customer_id' => ['nullable', 'exists:customers,id'],
            'lines.*.partner_agency_id' => ['nullable', 'exists:partner_agencies,id'],
            'lines.*.employee_id' => ['nullable', "exists:{$userTable},id"],
            'lines.*.ticket_booking_id' => ['nullable', 'exists:ticket_bookings,id'],
            'lines.*.financial_document_id' => ['nullable', 'exists:financial_documents,id'],
        ]);
    }

    private function prepareEntryData(array $data, ?JournalEntry $existing = null): array
    {
        $status = $data['status'] ?? $existing?->status ?? JournalEntryStatus::DRAFT;
        $statusEnum = $status instanceof JournalEntryStatus ? $status : JournalEntryStatus::from($status);

        if ($statusEnum === JournalEntryStatus::POSTED && empty($data['posted_at'])) {
            $data['posted_at'] = now();
        }

        $data['status'] = $statusEnum;

        return $data;
    }

    private function syncLines(JournalEntry $entry, array $lines): void
    {
        if (empty($lines)) {
            throw ValidationException::withMessages([
                'lines' => 'At least one journal entry line is required.',
            ]);
        }

        $entry->lines()->delete();

        $debitSum = 0;
        $creditSum = 0;

        foreach ($lines as $attributes) {
            $debit = (float) ($attributes['debit'] ?? 0);
            $credit = (float) ($attributes['credit'] ?? 0);

            if ($debit === 0.0 && $credit === 0.0) {
                throw ValidationException::withMessages([
                    'lines' => 'Each line must include a debit or credit amount.',
                ]);
            }

            $entry->lines()->create($attributes);
            $debitSum += $debit;
            $creditSum += $credit;
        }

        $this->assertBalanced($debitSum, $creditSum);

        $entry->update([
            'total_debit' => $debitSum,
            'total_credit' => $creditSum,
        ]);
    }

    private function recalculateTotals(JournalEntry $entry): void
    {
        $totals = $entry->lines()
            ->selectRaw('COALESCE(SUM(debit), 0) as debit_sum, COALESCE(SUM(credit), 0) as credit_sum')
            ->first();

        if ($totals === null) {
            return;
        }

        $this->assertBalanced((float) $totals->debit_sum, (float) $totals->credit_sum);

        $entry->update([
            'total_debit' => $totals->debit_sum,
            'total_credit' => $totals->credit_sum,
        ]);
    }

    private function assertBalanced(float $debit, float $credit): void
    {
        if (abs($debit - $credit) > 0.01) {
            throw ValidationException::withMessages([
                'lines' => 'Journal entry is not balanced. Total debit must equal total credit.',
            ]);
        }
    }
}
