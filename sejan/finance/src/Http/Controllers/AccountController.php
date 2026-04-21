<?php

namespace Sejan\Finance\Http\Controllers;
use Illuminate\Routing\Controller;
use Sejan\Finance\Enums\AccountType;
use Sejan\Finance\Models\Account;
use Illuminate\Http\{JsonResponse,Request};
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\{Rule,ValidationException};

class AccountController extends Controller
{
    public function index(): JsonResponse
    {
        $accounts = Account::query()
            ->with('children')
            ->orderBy('code')
            ->paginate();

        return response()->json($accounts);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateAccount($request);

        $type = AccountType::from($data['type']);
        $data['code'] = $this->generateAccountCode($type);

        $account = Account::create($data);

        return response()->json($account->fresh()->load('children'), 201);
    }

    public function show(Account $account): JsonResponse
    {
        $account->load(['parent', 'children', 'budgets']);

        return response()->json($account);
    }

    public function update(Request $request, Account $account): JsonResponse
    {
        $data = $this->validateAccount($request, $account);

        unset($data['code']);
        $account->update($data);

        return response()->json($account->fresh()->load('children'));
    }

    public function destroy(Account $account): JsonResponse
    {
        $account->delete();

        return response()->json(null, 204);
    }

    private function validateAccount(Request $request, ?Account $account = null): array
    {
        return $request->validate([
            'code' => $account
                ? ['prohibited']
                : ['nullable', 'string', 'max:50', Rule::unique('accounts', 'code')],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(AccountType::class)],
            'category' => ['nullable', 'string', 'max:255'],
            'parent_id' => ['nullable', 'exists:accounts,id'],
            'opening_balance' => ['nullable', 'numeric'],
            'is_active' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);
    }

    private function generateAccountCode(AccountType $type): string
    {
        [$start, $end] = match ($type) {
            AccountType::ASSET => [1000, 1999],
            AccountType::LIABILITY => [2000, 2999],
            AccountType::EQUITY => [3000, 3999],
            AccountType::REVENUE => [4000, 4999],
            AccountType::EXPENSE => [5000, 6999],
            default => [9000, 9999],
        };

        $max = Account::query()
            ->whereRaw("code REGEXP '^[0-9]+$'")
            ->whereRaw('CAST(code AS UNSIGNED) BETWEEN ? AND ?', [$start, $end])
            ->max(DB::raw('CAST(code AS UNSIGNED)'));

        $next = $max ? $max + 1 : $start;

        if ($next > $end) {
            throw ValidationException::withMessages([
                'code' => "No available account codes left in the {$start}-{$end} range.",
            ]);
        }

        return (string) $next;
    }
}
