import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const inputClasses =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500';

export default function ChartOfAccounts({ accounts = [], can = {} }) {
    const [selectedId, setSelectedId] = useState(null);
    const selected = accounts.find((row) => row.id === selectedId) || null;

    const form = useForm({
        code: '',
        name: '',
        type: 'asset',
        parent_id: '',
        is_active: true,
        description: '',
    });

    const resetForm = () => {
        setSelectedId(null);
        form.reset();
        form.setData({
            code: '',
            name: '',
            type: 'asset',
            parent_id: '',
            is_active: true,
            description: '',
        });
    };

    const selectRow = (account) => {
        setSelectedId(account.id);
        form.setData({
            code: account.code,
            name: account.name,
            type: account.type,
            parent_id: account.parent_id ?? '',
            is_active: account.is_active,
            description: account.description ?? '',
        });
    };

    const createAccount = () => {
        form.post(route('finance.chart-of-accounts.store'), {
            preserveScroll: true,
            onSuccess: resetForm,
        });
    };

    const updateAccount = () => {
        if (!selected) return;

        form.put(route('finance.chart-of-accounts.update', selected.id), {
            preserveScroll: true,
        });
    };

    const deleteAccount = () => {
        if (!selected) return;

        router.delete(route('finance.chart-of-accounts.destroy', selected.id), {
            preserveScroll: true,
            onSuccess: resetForm,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Chart of Accounts</h2>
                    <p className="text-sm text-gray-500">Manage chart of accounts for voucher entry.</p>
                </div>
            }
        >
            <Head title="Chart of Accounts" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        {can.manage && <PrimaryButton type="button" onClick={createAccount}>Add</PrimaryButton>}
                        {can.manage && <PrimaryButton type="button" disabled={!selected} onClick={updateAccount}>Update</PrimaryButton>}
                        {can.manage && <SecondaryButton type="button" disabled={!selected} onClick={deleteAccount}>Delete</SecondaryButton>}
                        <SecondaryButton type="button" onClick={resetForm}>Clear</SecondaryButton>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="space-y-3">
                                <div>
                                    <InputLabel value="Account Code" />
                                    <TextInput className={inputClasses} value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} disabled={!can.manage || Boolean(selected)} />
                                    <InputError message={form.errors.code} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Account Name" />
                                    <TextInput className={inputClasses} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} disabled={!can.manage} />
                                </div>
                                <div>
                                    <InputLabel value="Account Type" />
                                    <select className={inputClasses} value={form.data.type} onChange={(e) => form.setData('type', e.target.value)} disabled={!can.manage}>
                                        <option value="asset">Asset</option>
                                        <option value="liability">Liability</option>
                                        <option value="equity">Equity</option>
                                        <option value="revenue">Income</option>
                                        <option value="expense">Expenditure</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel value="Parent Account" />
                                    <select className={inputClasses} value={form.data.parent_id} onChange={(e) => form.setData('parent_id', e.target.value)} disabled={!can.manage}>
                                        <option value="">None</option>
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>{account.code} - {account.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <InputLabel value="Description" />
                                    <TextInput className={inputClasses} value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} disabled={!can.manage} />
                                </div>
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                    <Checkbox checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} />
                                    Active
                                </label>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900">Account List</h3>
                            <div className="mt-3 overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-3 py-2">Code</th>
                                            <th className="px-3 py-2">Name</th>
                                            <th className="px-3 py-2">Type</th>
                                            <th className="px-3 py-2">Parent</th>
                                            <th className="px-3 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.length === 0 ? (
                                            <tr><td className="px-3 py-3 text-slate-400" colSpan={5}>No account yet.</td></tr>
                                        ) : accounts.map((account) => (
                                            <tr key={account.id} className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${selectedId === account.id ? 'bg-indigo-50' : ''}`} onClick={() => selectRow(account)}>
                                                <td className="px-3 py-2 font-semibold">{account.code}</td>
                                                <td className="px-3 py-2">{account.name}</td>
                                                <td className="px-3 py-2 capitalize">{account.type}</td>
                                                <td className="px-3 py-2">{account.parent ? `${account.parent.code} - ${account.parent.name}` : '-'}</td>
                                                <td className="px-3 py-2">{account.is_active ? 'Active' : 'Inactive'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
