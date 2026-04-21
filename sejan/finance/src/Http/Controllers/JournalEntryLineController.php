<?php

namespace Sejan\Finance\Http\Controllers;

use Sejan\Finance\Models\JournalEntry;
use Sejan\Finance\Models\JournalEntryLine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Routing\Controller;

class JournalEntryLineController extends Controller
{
    public function index(): JsonResponse
    {
        $lines = JournalEntryLine::query()
            ->with(['journalEntry', 'account'])
            ->latest()
            ->paginate();

        return response()->json($lines);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateLine($request);

        $line = JournalEntryLine::create($data);
        $this->updateEntryTotals($line->journalEntry);

        return response()->json($line->fresh()->load(['journalEntry', 'account']), 201);
    }

    public function show(JournalEntryLine $journalEntryLine): JsonResponse
    {
        $journalEntryLine->load(['journalEntry', 'account']);

        return response()->json($journalEntryLine);
    }

    public function update(Request $request, JournalEntryLine $journalEntryLine): JsonResponse
    {
        $data = $this->validateLine($request, $journalEntryLine);

        $journalEntryLine->update($data);
        $this->updateEntryTotals($journalEntryLine->journalEntry);

        return response()->json($journalEntryLine->fresh()->load(['journalEntry', 'account']));
    }

    public function destroy(JournalEntryLine $journalEntryLine): JsonResponse
    {
        $entry = $journalEntryLine->journalEntry;
        $journalEntryLine->delete();

        if ($entry) {
            $this->updateEntryTotals($entry);
        }

        return response()->json(null, 204);
    }

    private function validateLine(Request $request, ?JournalEntryLine $line = null): array
    {
        return $request->validate([
            'journal_entry_id' => ['required', 'exists:journal_entries,id'],
            'account_id' => ['required', 'exists:accounts,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'debit' => ['nullable', 'numeric', 'min:0'],
            'credit' => ['nullable', 'numeric', 'min:0'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'partner_agency_id' => ['nullable', 'exists:partner_agencies,id'],
            'employee_id' => ['nullable', 'exists:employees,id'],
            'ticket_booking_id' => ['nullable', 'exists:ticket_bookings,id'],
            'financial_document_id' => ['nullable', 'exists:financial_documents,id'],
        ]);
    }

    private function updateEntryTotals(JournalEntry $entry): void
    {
        $totals = $entry->lines()
            ->selectRaw('COALESCE(SUM(debit), 0) as debit_sum, COALESCE(SUM(credit), 0) as credit_sum')
            ->first();

        $debit = (float) ($totals->debit_sum ?? 0);
        $credit = (float) ($totals->credit_sum ?? 0);

        if (abs($debit - $credit) > 0.01) {
            throw ValidationException::withMessages([
                'journal_entry_id' => 'Journal entry is not balanced after the change. Ensure total debit equals total credit.',
            ]);
        }

        $entry->update([
            'total_debit' => $debit,
            'total_credit' => $credit,
        ]);
    }
}
