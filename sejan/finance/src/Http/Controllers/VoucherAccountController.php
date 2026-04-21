<?php

namespace Sejan\Finance\Http\Controllers;

use Sejan\Finance\Models\VoucherAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controller;

class VoucherAccountController extends Controller
{
    public function index(Request $request): Response
    {
        $accounts = VoucherAccount::query()
            ->with('parent')
            ->orderBy('code')
            ->get()
            ->map(fn (VoucherAccount $account) => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'parent_id' => $account->parent_id,
                'parent' => $account->parent ? [
                    'id' => $account->parent->id,
                    'code' => $account->parent->code,
                    'name' => $account->parent->name,
                ] : null,
                'is_active' => (bool) $account->is_active,
                'description' => $account->description,
            ]);

        return Inertia::render('Finance/Voucher/ChartOfAccounts', [
            'accounts' => $accounts,
            'can' => [
                'manage' => $request->user()->can('finance.manage'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:30', Rule::unique('voucher_accounts', 'code')],
            'name' => ['required', 'string', 'max:150'],
            'type' => ['required', Rule::in(['asset', 'liability', 'equity', 'revenue', 'expense'])],
            'parent_id' => ['nullable', 'exists:voucher_accounts,id'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        VoucherAccount::create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'type' => $validated['type'],
            'parent_id' => $validated['parent_id'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()
            ->route('finance.v2.chart-of-accounts.index')
            ->with('success', 'V2 chart of account created.');
    }

    public function update(Request $request, VoucherAccount $voucherAccount): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'type' => ['required', Rule::in(['asset', 'liability', 'equity', 'revenue', 'expense'])],
            'parent_id' => ['nullable', 'exists:voucher_accounts,id'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $voucherAccount->update([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'parent_id' => $validated['parent_id'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()
            ->route('finance.v2.chart-of-accounts.index')
            ->with('success', 'V2 chart of account updated.');
    }

    public function destroy(VoucherAccount $voucherAccount): RedirectResponse
    {
        $voucherAccount->delete();

        return redirect()
            ->route('finance.v2.chart-of-accounts.index')
            ->with('success', 'V2 chart of account deleted.');
    }
}
