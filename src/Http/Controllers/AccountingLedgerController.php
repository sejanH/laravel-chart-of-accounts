<?php

namespace Sejan\Finance\Http\Controllers;

use Sejan\Finance\Enums\AccountType;
use Sejan\Finance\Enums\JournalEntryStatus;
use Sejan\Finance\Http\Controllers\AccountController as AccountApiController;
use Sejan\Finance\Http\Controllers\JournalEntryController as JournalEntryApiController;
use Sejan\Finance\Models\Account;
use Sejan\Finance\Models\JournalEntry;
use Illuminate\Http\{RedirectResponse,Request};
use Illuminate\Support\Facades\Config;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AccountingLedgerController extends Controller
{
    public function index(Request $request): Response
    {
        $accountType = $request->string('account_type')->toString();
        $onlyActive = $request->boolean('only_active');

        $accountQuery = Account::query()
            ->with('parent')
            ->orderBy('code');

        if ($accountType !== '') {
            $accountQuery->where('type', $accountType);
        }

        if ($onlyActive) {
            $accountQuery->where('is_active', true);
        }

        $accounts = $accountQuery
            ->get()
            ->map(function (Account $account) {
                return [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'type' => $account->type->value,
                    'type_label' => $this->accountTypeLabel($account->type->value),
                    'category' => $account->category,
                    'parent' => $account->parent ? [
                        'id' => $account->parent->id,
                        'code' => $account->parent->code,
                        'name' => $account->parent->name,
                    ] : null,
                    'opening_balance' => (float) ($account->opening_balance ?? 0),
                    'is_active' => (bool) $account->is_active,
                    'description' => $account->description,
                ];
            });

        $accountSummary = [
            'total' => Account::count(),
            'active' => Account::where('is_active', true)->count(),
            'assets' => Account::where('type', AccountType::ASSET)->count(),
            'liabilities' => Account::where('type', AccountType::LIABILITY)->count(),
        ];

        $status = $request->string('status')->toString();
        $from = $request->string('from')->toString();
        $to = $request->string('to')->toString();
        $search = $request->string('search')->toString();

        $journalQuery = JournalEntry::query()
            ->with(['lines.account', 'preparedBy', 'approvedBy'])
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($from, fn ($query) => $query->whereDate('entry_date', '>=', $from))
            ->when($to, fn ($query) => $query->whereDate('entry_date', '<=', $to))
            ->when($search, function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('reference', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%");
                });
            })
            ->latest('entry_date');

        $entries = $journalQuery
            ->paginate(10)
            ->withQueryString()
            ->through(function (JournalEntry $entry) {
                return [
                    'id' => $entry->id,
                    'reference' => $entry->reference,
                    'title' => $entry->title,
                    'entry_date' => optional($entry->entry_date)->toDateString(),
                    'status' => $entry->status->value,
                    'status_label' => $this->journalStatusLabel($entry->status->value),
                    'total_debit' => (float) ($entry->total_debit ?? 0),
                    'total_credit' => (float) ($entry->total_credit ?? 0),
                    'prepared_by' => $entry->preparedBy ? [
                        'id' => $entry->preparedBy->id,
                        'name' => trim($entry->preparedBy->first_name.' '.$entry->preparedBy->last_name),
                    ] : null,
                    'approved_by' => $entry->approvedBy ? [
                        'id' => $entry->approvedBy->id,
                        'name' => trim($entry->approvedBy->first_name.' '.$entry->approvedBy->last_name),
                    ] : null,
                    'lines' => $entry->lines->map(function ($line) {
                        return [
                            'id' => $line->id,
                            'description' => $line->description,
                            'debit' => (float) ($line->debit ?? 0),
                            'credit' => (float) ($line->credit ?? 0),
                            'account' => $line->account ? [
                                'id' => $line->account->id,
                                'code' => $line->account->code,
                                'name' => $line->account->name,
                            ] : null,
                        ];
                    }),
                ];
            });

        $entrySummary = [
            'total' => JournalEntry::count(),
            'drafts' => JournalEntry::where('status', JournalEntryStatus::DRAFT)->count(),
            'posted_this_month' => (float) JournalEntry::where('status', JournalEntryStatus::POSTED)
                ->whereBetween('entry_date', [now()->startOfMonth(), now()->endOfMonth()])
                ->sum('total_debit'),
        ];

        $accountTypes = collect(AccountType::cases())->map(function (AccountType $type) {
            return [
                'value' => $type->value,
                'label' => $this->accountTypeLabel($type->value),
            ];
        });

        $journalStatuses = collect(JournalEntryStatus::cases())->map(function (JournalEntryStatus $statusCase) {
            return [
                'value' => $statusCase->value,
                'label' => $this->journalStatusLabel($statusCase->value),
            ];
        });

        $accountsForSelect = Account::orderBy('code')
            ->get(['id', 'code', 'name'])
            ->map(fn (Account $account) => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'label' => $account->code.' – '.$account->name,
            ]);

        $userModel = Config::get('finance.user_model');
        $userNameField = Config::get('finance.user_name_field');
        
        $users = $userModel::orderBy($userNameField)
            ->get(['id', $userNameField])
            ->map(function ($user) use ($userNameField) {
                $name = $userNameField === 'name' ? $user->name : trim($user->first_name.' '.$user->last_name);
                return [
                    'id' => $user->id,
                    'name' => $name,
                ];
            });

        return Inertia::render('Finance/Ledger', [
            'filters' => [
                'account_type' => $accountType,
                'only_active' => $onlyActive,
                'status' => $status,
                'from' => $from,
                'to' => $to,
                'search' => $search,
            ],
            'accounts' => $accounts,
            'accountSummary' => $accountSummary,
            'entries' => $entries,
            'entrySummary' => $entrySummary,
            'accountTypes' => $accountTypes,
            'journalStatuses' => $journalStatuses,
            'accountOptions' => $accountsForSelect,
            'users' => $users,
            'can' => [
                'manage' => $request->user()->can('finance.manage'),
            ],
        ]);
    }

    public function storeAccount(
        Request $request,
        AccountApiController $accountController
    ): RedirectResponse {
        $accountController->store($request);

        return redirect()
            ->route('finance.chart-of-accounts.index')
            ->with('success', 'Account created successfully.');
    }

    public function storeJournalEntry(
        Request $request,
        JournalEntryApiController $journalEntryController
    ): RedirectResponse {
        $journalEntryController->store($request);

        return redirect()
            ->route('finance.chart-of-accounts.index')
            ->with('success', 'Journal entry recorded successfully.');
    }

    private function accountTypeLabel(string $value): string
    {
        return match ($value) {
            'asset' => 'Asset',
            'liability' => 'Liability',
            'equity' => 'Equity',
            'revenue' => 'Revenue',
            'expense' => 'Expense',
            default => 'Other',
        };
    }

    private function journalStatusLabel(string $value): string
    {
        return match ($value) {
            'draft' => 'Draft',
            'posted' => 'Posted',
            'void' => 'Void',
            default => ucfirst($value),
        };
    }
}
