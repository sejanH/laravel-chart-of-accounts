import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';
import Checkbox from '@/Components/Checkbox';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const inputClasses =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500';

const today = () => new Date().toISOString().slice(0, 10);

const money = (value) =>
    `৳${Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export default function Ledger({
    filters = {},
    accounts = [],
    accountSummary = {},
    entries = { data: [], meta: { links: [] } },
    entrySummary = {},
    accountTypes = [],
    journalStatuses = [],
    accountOptions = [],
    employees = [],
    can = {},
}) {
    const [accountTypeFilter, setAccountTypeFilter] = useState(filters.account_type ?? '');
    const [onlyActive, setOnlyActive] = useState(Boolean(filters.only_active));
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
    const [fromDate, setFromDate] = useState(filters.from ?? '');
    const [toDate, setToDate] = useState(filters.to ?? '');
    const [search, setSearch] = useState(filters.search ?? '');

    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showEntryModal, setShowEntryModal] = useState(false);

    const defaultAccountType = accountTypes[0]?.value ?? 'asset';
    const defaultJournalStatus = journalStatuses[0]?.value ?? 'draft';

    const makeEmptyLine = () => ({
        account_id: accountOptions[0]?.id ?? '',
        description: '',
        debit: '',
        credit: '',
    });

    const accountForm = useForm({
        code: '',
        name: '',
        type: defaultAccountType,
        category: '',
        parent_id: '',
        opening_balance: '',
        is_active: true,
        description: '',
    });

    const entryForm = useForm({
        reference: '',
        title: '',
        entry_date: today(),
        status: defaultJournalStatus,
        prepared_by_employee_id: '',
        approved_by_employee_id: '',
        notes: '',
        lines: [makeEmptyLine(), makeEmptyLine()],
    });

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                route('finance.chart-of-accounts.index'),
                {
                    account_type: accountTypeFilter || undefined,
                    only_active: onlyActive ? 1 : undefined,
                    status: statusFilter || undefined,
                    from: fromDate || undefined,
                    to: toDate || undefined,
                    search: search || undefined,
                },
                { preserveState: true, replace: true, preserveScroll: true },
            );
        }, 400);

        return () => clearTimeout(timeout);
    }, [accountTypeFilter, onlyActive, statusFilter, fromDate, toDate, search]);

    const resetFilters = () => {
        setAccountTypeFilter('');
        setOnlyActive(false);
        setStatusFilter('');
        setFromDate('');
        setToDate('');
        setSearch('');
        router.get(route('finance.chart-of-accounts.index'), {}, {
            preserveState: false,
            replace: true,
            preserveScroll: true,
        });
    };

    const totals = useMemo(() => {
        return entryForm.data.lines.reduce(
            (acc, line) => {
                const debit = parseFloat(line.debit);
                const credit = parseFloat(line.credit);

                return {
                    debit: acc.debit + (Number.isFinite(debit) ? debit : 0),
                    credit: acc.credit + (Number.isFinite(credit) ? credit : 0),
                };
            },
            { debit: 0, credit: 0 },
        );
    }, [entryForm.data.lines]);

    const balanceDiff = totals.debit - totals.credit;
    const isBalanced = Math.abs(balanceDiff) < 0.01;

    const closeAccountModal = () => {
        setShowAccountModal(false);
        accountForm.clearErrors();
    };

    const closeEntryModal = () => {
        setShowEntryModal(false);
        entryForm.clearErrors();
    };

    const submitAccount = (event) => {
        event.preventDefault();
        accountForm.transform((data) => ({
            ...data,
            type: data.type || defaultAccountType,
            category: data.category || null,
            parent_id: data.parent_id || null,
            opening_balance: data.opening_balance === '' ? null : data.opening_balance,
            is_active: data.is_active ? 1 : 0,
            description: data.description || null,
        }));

        accountForm.post(route('finance.chart-of-accounts.accounts.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowAccountModal(false);
                accountForm.reset();
                accountForm.setData('type', defaultAccountType);
                accountForm.setData('is_active', true);
            },
            onFinish: () => {
                accountForm.transform((data) => data);
            },
        });
    };

    const submitEntry = (event) => {
        event.preventDefault();
        entryForm.transform((data) => ({
            ...data,
            status: data.status || defaultJournalStatus,
            prepared_by_employee_id: data.prepared_by_employee_id || null,
            approved_by_employee_id: data.approved_by_employee_id || null,
            notes: data.notes || null,
            lines: data.lines.map((line) => ({
                account_id: line.account_id || null,
                description: line.description || null,
                debit: line.debit === '' ? null : Number(line.debit),
                credit: line.credit === '' ? null : Number(line.credit),
            })),
        }));

        entryForm.post(route('finance.chart-of-accounts.entries.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowEntryModal(false);
                entryForm.reset();
                entryForm.setData('entry_date', today());
                entryForm.setData('status', defaultJournalStatus);
                entryForm.setData('lines', [makeEmptyLine(), makeEmptyLine()]);
            },
            onFinish: () => {
                entryForm.transform((data) => data);
            },
        });
    };

    const updateLine = (index, field, value) => {
        entryForm.setData('lines', entryForm.data.lines.map((line, lineIndex) => {
            if (lineIndex !== index) {
                return line;
            }

            return {
                ...line,
                [field]: value,
            };
        }));
    };

    const addLine = () => {
        entryForm.setData('lines', [...entryForm.data.lines, makeEmptyLine()]);
    };

    const removeLine = (index) => {
        if (entryForm.data.lines.length <= 2) {
            return;
        }

        entryForm.setData(
            'lines',
            entryForm.data.lines.filter((_, lineIndex) => lineIndex !== index),
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Chart of accounts
                    </h2>
                    <p className="text-sm text-gray-500">
                        Maintain account codes and capture balanced journal activity.
                    </p>
                </div>
            }
        >
            <Head title="Chart of Accounts" />

            <section className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/10 p-8 text-white shadow-xl shadow-indigo-900/30 backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-indigo-100/80">Accounts</p>
                            <p className="text-3xl font-semibold">{accountSummary.total ?? 0}</p>
                            <p className="mt-1 text-xs text-indigo-100/70">Total chart of account records</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-indigo-100/80">Active</p>
                            <p className="text-3xl font-semibold">{accountSummary.active ?? 0}</p>
                            <p className="mt-1 text-xs text-indigo-100/70">Ready for postings</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-indigo-100/80">Assets</p>
                            <p className="text-3xl font-semibold">{accountSummary.assets ?? 0}</p>
                            <p className="mt-1 text-xs text-indigo-100/70">Asset-class codes</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-indigo-100/80">Liabilities</p>
                            <p className="text-3xl font-semibold">{accountSummary.liabilities ?? 0}</p>
                            <p className="mt-1 text-xs text-indigo-100/70">Liability-class codes</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Chart of accounts</h3>
                            <p className="text-sm text-slate-500">Filter by account type or focus on active codes only.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div>
                                <InputLabel htmlFor="account-type-filter" value="Account type" className="text-xs uppercase tracking-[0.2em] text-slate-500" />
                                <select
                                    id="account-type-filter"
                                    value={accountTypeFilter}
                                    onChange={(event) => setAccountTypeFilter(event.target.value)}
                                    className={inputClasses}
                                >
                                    <option value="">All types</option>
                                    {accountTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <label className="mt-6 flex items-center gap-2 text-sm text-slate-600">
                                <Checkbox
                                    checked={onlyActive}
                                    onChange={(event) => setOnlyActive(event.target.checked)}
                                />
                                Active only
                            </label>
                            {can.manage && (
                                <PrimaryButton type="button" onClick={() => {
                                    accountForm.reset();
                                    accountForm.clearErrors();
                                    accountForm.setData('type', defaultAccountType);
                                    accountForm.setData('is_active', true);
                                    setShowAccountModal(true);
                                }}>
                                    New account
                                </PrimaryButton>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <th className="px-4 py-3">Code</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Parent</th>
                                    <th className="px-4 py-3 text-right">Opening balance</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-600">
                                {accounts.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-6 text-center text-slate-400" colSpan={6}>
                                            No accounts match the current filters yet.
                                        </td>
                                    </tr>
                                ) : (
                                    accounts.map((account) => (
                                        <tr key={account.id}>
                                            <td className="px-4 py-3 font-semibold text-slate-900">{account.code}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{account.name}</div>
                                                {account.category && (
                                                    <div className="text-xs text-slate-500">{account.category}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 capitalize">{account.type_label}</td>
                                            <td className="px-4 py-3">
                                                {account.parent ? (
                                                    <>
                                                        <div className="font-medium text-slate-900">{account.parent.code}</div>
                                                        <div className="text-xs text-slate-500">{account.parent.name}</div>
                                                    </>
                                                ) : (
                                                    <span className="text-xs uppercase tracking-wide text-slate-400">Top level</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{money(account.opening_balance)}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        account.is_active
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-200 text-slate-600'
                                                    }`}
                                                >
                                                    {account.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Journal entries</h3>
                            <p className="text-sm text-slate-500">Keep a balanced record of manual adjustments and accruals.</p>
                        </div>
                        <div className="flex flex-wrap items-end gap-3">
                            <div>
                                <InputLabel htmlFor="journal-search" value="Search" className="text-xs uppercase tracking-[0.2em] text-slate-500" />
                                <TextInput
                                    id="journal-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Reference or title"
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="journal-status" value="Status" className="text-xs uppercase tracking-[0.2em] text-slate-500" />
                                <select
                                    id="journal-status"
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    className={inputClasses}
                                >
                                    <option value="">All statuses</option>
                                    {journalStatuses.map((status) => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <InputLabel value="Date from" className="text-xs uppercase tracking-[0.2em] text-slate-500" />
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(event) => setFromDate(event.target.value)}
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <InputLabel value="Date to" className="text-xs uppercase tracking-[0.2em] text-slate-500" />
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(event) => setToDate(event.target.value)}
                                    className={inputClasses}
                                />
                            </div>
                            <SecondaryButton type="button" onClick={resetFilters}>
                                Reset filters
                            </SecondaryButton>
                            {can.manage && (
                                <SecondaryButton className='bg-red-400 border-red-400 text-white' type="button" onClick={() => {
                                    entryForm.reset();
                                    entryForm.clearErrors();
                                    entryForm.setData('entry_date', today());
                                    entryForm.setData('status', defaultJournalStatus);
                                    entryForm.setData('lines', [makeEmptyLine(), makeEmptyLine()]);
                                    setShowEntryModal(true);
                                }}>
                                    New journal entry
                                </SecondaryButton>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Total entries</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{entrySummary.total ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Drafts</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{entrySummary.drafts ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Posted this month</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{money(entrySummary.posted_this_month ?? 0)}</p>
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <th className="px-4 py-3">Reference</th>
                                    <th className="px-4 py-3">Entry date</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Debit</th>
                                    <th className="px-4 py-3 text-right">Credit</th>
                                    <th className="px-4 py-3">Prepared by</th>
                                    <th className="px-4 py-3">Lines</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-600">
                                {entries.data.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-6 text-center text-slate-400" colSpan={7}>
                                            No journal entries yet. Create one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    entries.data.map((entry) => (
                                        <tr key={entry.id}>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900">{entry.reference}</div>
                                                {entry.title && (
                                                    <div className="text-xs text-slate-500">{entry.title}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{entry.entry_date}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        entry.status === 'posted'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : entry.status === 'void'
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {entry.status_label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{money(entry.total_debit)}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{money(entry.total_credit)}</td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-slate-600">
                                                    {entry.prepared_by?.name ?? '—'}
                                                </div>
                                                {entry.approved_by && (
                                                    <div className="text-xs text-slate-400">Approved: {entry.approved_by.name}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-2">
                                                    {entry.lines.map((line) => (
                                                        <div key={line.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                                            <div className="font-semibold text-slate-900">
                                                                {line.account ? `${line.account.code} • ${line.account.name}` : 'Account removed'}
                                                            </div>
                                                            {line.description && (
                                                                <div className="text-[11px] text-slate-500">{line.description}</div>
                                                            )}
                                                            <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
                                                                <span>Debit: {money(line.debit)}</span>
                                                                <span>Credit: {money(line.credit)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {entries.meta?.links?.length > 1 && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                            <div>
                                Showing {entries.meta.from ?? 0}–{entries.meta.to ?? 0} of {entries.meta.total ?? entries.data.length}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {entries.meta.links.map((link, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`rounded-full px-3 py-1 text-sm transition ${
                                            link.active
                                                ? 'bg-indigo-600 font-semibold text-white shadow'
                                                : link.url
                                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    : 'pointer-events-none bg-slate-100 text-slate-400'
                                        }`}
                                        onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <Modal show={showAccountModal} onClose={closeAccountModal} maxWidth="2xl">
                <form onSubmit={submitAccount} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900">Create account</h3>
                    <p className="mt-1 text-sm text-slate-500">Add a new chart of account code for structured postings.</p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="account-code" value="Account code" />
                            <TextInput
                                id="account-code"
                                value={accountForm.data.code}
                                readOnly
                                className={inputClasses}
                                placeholder="Auto-generated on save"
                            />
                            <p className="mt-2 text-xs text-slate-500">Code will be assigned based on the account type.</p>
                            <InputError message={accountForm.errors.code} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="account-name" value="Account name" />
                            <TextInput
                                id="account-name"
                                value={accountForm.data.name}
                                onChange={(event) => accountForm.setData('name', event.target.value)}
                                className={inputClasses}
                                required
                            />
                            <InputError message={accountForm.errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="account-type" value="Type" />
                            <select
                                id="account-type"
                                value={accountForm.data.type}
                                onChange={(event) => accountForm.setData('type', event.target.value)}
                                className={inputClasses}
                                required
                            >
                                {accountTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={accountForm.errors.type} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="account-category" value="Category" />
                            <TextInput
                                id="account-category"
                                value={accountForm.data.category}
                                onChange={(event) => accountForm.setData('category', event.target.value)}
                                className={inputClasses}
                                placeholder="Optional grouping"
                            />
                            <InputError message={accountForm.errors.category} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="account-parent" value="Parent account" />
                            <select
                                id="account-parent"
                                value={accountForm.data.parent_id}
                                onChange={(event) => accountForm.setData('parent_id', event.target.value)}
                                className={inputClasses}
                            >
                                <option value="">No parent</option>
                                {accountOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={accountForm.errors.parent_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="account-opening-balance" value="Opening balance" />
                            <input
                                id="account-opening-balance"
                                type="number"
                                step="0.01"
                                className={inputClasses}
                                value={accountForm.data.opening_balance}
                                onChange={(event) => accountForm.setData('opening_balance', event.target.value)}
                            />
                            <InputError message={accountForm.errors.opening_balance} className="mt-2" />
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="account-description" value="Description" />
                            <textarea
                                id="account-description"
                                className={`${inputClasses} min-h-[96px]`}
                                value={accountForm.data.description}
                                onChange={(event) => accountForm.setData('description', event.target.value)}
                                placeholder="Optional notes for this account"
                            />
                            <InputError message={accountForm.errors.description} className="mt-2" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="account-active"
                                checked={accountForm.data.is_active}
                                onChange={(event) => accountForm.setData('is_active', event.target.checked)}
                            />
                            <label htmlFor="account-active" className="text-sm text-slate-600">Active account</label>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={closeAccountModal}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={accountForm.processing}>
                            Save account
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showEntryModal} onClose={closeEntryModal} maxWidth="4xl">
                <form onSubmit={submitEntry} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900">Record journal entry</h3>
                    <p className="mt-1 text-sm text-slate-500">Ensure total debits match total credits before posting.</p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="entry-reference" value="Reference" />
                            <TextInput
                                id="entry-reference"
                                value={entryForm.data.reference}
                                onChange={(event) => entryForm.setData('reference', event.target.value)}
                                className={inputClasses}
                                required
                            />
                            <InputError message={entryForm.errors.reference} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="entry-title" value="Title" />
                            <TextInput
                                id="entry-title"
                                value={entryForm.data.title}
                                onChange={(event) => entryForm.setData('title', event.target.value)}
                                className={inputClasses}
                                placeholder="Optional summary"
                            />
                            <InputError message={entryForm.errors.title} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="entry-date" value="Entry date" />
                            <input
                                id="entry-date"
                                type="date"
                                className={inputClasses}
                                value={entryForm.data.entry_date}
                                onChange={(event) => entryForm.setData('entry_date', event.target.value)}
                                required
                            />
                            <InputError message={entryForm.errors.entry_date} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="entry-status" value="Status" />
                            <select
                                id="entry-status"
                                className={inputClasses}
                                value={entryForm.data.status}
                                onChange={(event) => entryForm.setData('status', event.target.value)}
                            >
                                {journalStatuses.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={entryForm.errors.status} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="entry-prepared" value="Prepared by" />
                            <select
                                id="entry-prepared"
                                className={inputClasses}
                                value={entryForm.data.prepared_by_employee_id}
                                onChange={(event) => entryForm.setData('prepared_by_employee_id', event.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={entryForm.errors.prepared_by_employee_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="entry-approved" value="Approved by" />
                            <select
                                id="entry-approved"
                                className={inputClasses}
                                value={entryForm.data.approved_by_employee_id}
                                onChange={(event) => entryForm.setData('approved_by_employee_id', event.target.value)}
                            >
                                <option value="">Pending approval</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={entryForm.errors.approved_by_employee_id} className="mt-2" />
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="entry-notes" value="Notes" />
                            <textarea
                                id="entry-notes"
                                className={`${inputClasses} min-h-[96px]`}
                                value={entryForm.data.notes}
                                onChange={(event) => entryForm.setData('notes', event.target.value)}
                                placeholder="Supporting context for review"
                            />
                            <InputError message={entryForm.errors.notes} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Distribution lines
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <span>
                                    Total debit: <span className="font-semibold text-slate-900">{money(totals.debit)}</span>
                                </span>
                                <span>
                                    Total credit: <span className="font-semibold text-slate-900">{money(totals.credit)}</span>
                                </span>
                                <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                        isBalanced
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                    }`}
                                >
                                    {isBalanced
                                        ? 'Balanced'
                                        : `Out of balance by ${money(Math.abs(balanceDiff))}`}
                                </span>
                                <SecondaryButton type="button" onClick={addLine}>
                                    Add line
                                </SecondaryButton>
                            </div>
                        </div>
                        <InputError message={entryForm.errors.lines} className="mt-2" />

                        <div className="mt-3 space-y-4">
                            {entryForm.data.lines.map((line, index) => (
                                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="grid gap-4 sm:grid-cols-[2fr_2fr_1fr_1fr_auto]">
                                        <div>
                                            <InputLabel value="Account" />
                                            <select
                                                value={line.account_id}
                                                onChange={(event) => updateLine(index, 'account_id', event.target.value)}
                                                className={inputClasses}
                                                required
                                            >
                                                <option value="">Select account</option>
                                                {accountOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={entryForm.errors[`lines.${index}.account_id`]} className="mt-1" />
                                        </div>
                                        <div>
                                            <InputLabel value="Description" />
                                            <TextInput
                                                value={line.description}
                                                onChange={(event) => updateLine(index, 'description', event.target.value)}
                                                className={inputClasses}
                                                placeholder="Optional memo"
                                            />
                                            <InputError message={entryForm.errors[`lines.${index}.description`]} className="mt-1" />
                                        </div>
                                        <div>
                                            <InputLabel value="Debit" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={inputClasses}
                                                value={line.debit}
                                                onChange={(event) => updateLine(index, 'debit', event.target.value)}
                                            />
                                            <InputError message={entryForm.errors[`lines.${index}.debit`]} className="mt-1" />
                                        </div>
                                        <div>
                                            <InputLabel value="Credit" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={inputClasses}
                                                value={line.credit}
                                                onChange={(event) => updateLine(index, 'credit', event.target.value)}
                                            />
                                            <InputError message={entryForm.errors[`lines.${index}.credit`]} className="mt-1" />
                                        </div>
                                        <div className="flex items-end justify-end">
                                            <SecondaryButton
                                                type="button"
                                                onClick={() => removeLine(index)}
                                                disabled={entryForm.data.lines.length <= 2}
                                            >
                                                Remove
                                            </SecondaryButton>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={closeEntryModal}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={entryForm.processing}>
                            Save journal entry
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
