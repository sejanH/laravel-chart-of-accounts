import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const inputClasses =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500';

const money = (value) =>
    Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export default function VoucherDetailsEntry({ voucher, lines = [], accounts = [], can = {} }) {
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [editingLine, setEditingLine] = useState(null);

    const selectedLine = useMemo(
        () => lines.find((line) => line.id === editingLine) || null,
        [lines, editingLine],
    );

    const form = useForm({
        voucher_account_id: selectedLine?.voucher_account_id ?? accounts[0]?.id ?? '',
        description: selectedLine?.description ?? '',
        amount: selectedLine?.amount ?? '',
        entry_side: selectedLine?.entry_side ?? 'debit',
        remarks: selectedLine?.remarks ?? '',
        account_source: selectedLine?.account_source ?? 'Ledger',
        sub_account_code: selectedLine?.sub_account_code ?? '',
        sub_account_description: selectedLine?.sub_account_description ?? '',
    });

    const resetForCreate = () => {
        setEditingLine(null);
        form.reset();
        form.setData({
            voucher_account_id: accounts[0]?.id ?? '',
            description: '',
            amount: '',
            entry_side: 'debit',
            remarks: '',
            account_source: 'Ledger',
            sub_account_code: '',
            sub_account_description: '',
        });
    };

    const setForEdit = (line) => {
        setEditingLine(line.id);
        form.setData({
            voucher_account_id: line.voucher_account_id,
            description: line.description ?? '',
            amount: line.amount,
            entry_side: line.entry_side,
            remarks: line.remarks ?? '',
            account_source: line.account_source ?? 'Ledger',
            sub_account_code: line.sub_account_code ?? '',
            sub_account_description: line.sub_account_description ?? '',
        });
    };

    const submit = (event) => {
        event.preventDefault();

        if (editingLine) {
            form.put(route('finance.vouchers.lines.update', [voucher.id, editingLine]), {
                preserveScroll: true,
            });
            return;
        }

        form.post(route('finance.vouchers.lines.store', voucher.id), {
            preserveScroll: true,
        });
    };

    const deleteLine = (lineId) => {
        router.delete(route('finance.vouchers.lines.destroy', [voucher.id, lineId]), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Voucher Details Entry</h2>
                    <p className="text-sm text-gray-500">Voucher Number: {voucher.voucher_no}</p>
                </div>
            }
        >
            <Head title="Voucher Details Entry" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        {can.manage && <PrimaryButton type="button" onClick={submit}>Add</PrimaryButton>}
                        {can.manage && <PrimaryButton type="button" disabled={!editingLine} onClick={submit}>Update</PrimaryButton>}
                        {can.manage && <SecondaryButton type="button" disabled={!editingLine} onClick={() => editingLine && deleteLine(editingLine)}>Delete</SecondaryButton>}
                        <SecondaryButton type="button" onClick={resetForCreate}>Clear</SecondaryButton>
                        <SecondaryButton type="button" onClick={() => router.get(route('finance.vouchers.index', { selected: voucher.id }))}>Back</SecondaryButton>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
                        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="space-y-3">
                                <div>
                                    <InputLabel value="Voucher Number" />
                                    <TextInput className={inputClasses} value={voucher.voucher_no} readOnly />
                                </div>
                                <div>
                                    <InputLabel value="Account Number" />
                                    <div className="grid grid-cols-[1fr_auto] gap-2">
                                        <select className={inputClasses} value={form.data.voucher_account_id} onChange={(e) => form.setData('voucher_account_id', e.target.value)} disabled={!can.manage}>
                                            <option value="">Select account</option>
                                            {accounts.map((account) => (
                                                <option key={account.id} value={account.id}>{account.label}</option>
                                            ))}
                                        </select>
                                        <button type="button" className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700" onClick={() => setShowAccountModal(true)}>
                                            ...
                                        </button>
                                    </div>
                                    <InputError message={form.errors.voucher_account_id} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Description" />
                                    <TextInput className={inputClasses} value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} disabled={!can.manage} />
                                </div>
                                <div>
                                    <InputLabel value="Amount" />
                                    <TextInput type="number" min="0" step="0.01" className={inputClasses} value={form.data.amount} onChange={(e) => form.setData('amount', e.target.value)} disabled={!can.manage} />
                                    <InputError message={form.errors.amount} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Entry Side" />
                                    <select className={inputClasses} value={form.data.entry_side} onChange={(e) => form.setData('entry_side', e.target.value)} disabled={!can.manage}>
                                        <option value="debit">Debit</option>
                                        <option value="credit">Credit</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel value="Remarks" />
                                    <TextInput className={inputClasses} value={form.data.remarks} onChange={(e) => form.setData('remarks', e.target.value)} disabled={!can.manage} />
                                </div>
                                <div>
                                    <InputLabel value="Account Source" />
                                    <TextInput className={inputClasses} value={form.data.account_source} onChange={(e) => form.setData('account_source', e.target.value)} disabled={!can.manage} />
                                </div>
                                <div>
                                    <InputLabel value="Sub Account" />
                                    <TextInput className={inputClasses} value={form.data.sub_account_code} onChange={(e) => form.setData('sub_account_code', e.target.value)} disabled={!can.manage} />
                                </div>
                                <div>
                                    <InputLabel value="Sub Description" />
                                    <TextInput className={inputClasses} value={form.data.sub_account_description} onChange={(e) => form.setData('sub_account_description', e.target.value)} disabled={!can.manage} />
                                </div>
                                <div>
                                    <InputLabel value="Row Number" />
                                    <TextInput className={inputClasses} value={selectedLine?.row_no ?? (lines.length + 1)} readOnly />
                                </div>
                            </div>
                        </form>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900">Details for {voucher.voucher_no}</h3>
                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-3 py-2">Row</th>
                                            <th className="px-3 py-2">Account</th>
                                            <th className="px-3 py-2">Description</th>
                                            <th className="px-3 py-2 text-right">Debit</th>
                                            <th className="px-3 py-2 text-right">Credit</th>
                                            <th className="px-3 py-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.length === 0 ? (
                                            <tr><td colSpan={6} className="px-3 py-3 text-slate-400">No details yet.</td></tr>
                                        ) : lines.map((line) => (
                                            <tr key={line.id} className={`border-t border-slate-100 ${editingLine === line.id ? 'bg-indigo-50' : ''}`}>
                                                <td className="px-3 py-2">{line.row_no}</td>
                                                <td className="px-3 py-2">{line.account_no} - {line.account_name}</td>
                                                <td className="px-3 py-2">{line.description || '-'}</td>
                                                <td className="px-3 py-2 text-right">{money(line.entry_side === 'debit' ? line.amount : 0)}</td>
                                                <td className="px-3 py-2 text-right">{money(line.entry_side === 'credit' ? line.amount : 0)}</td>
                                                <td className="px-3 py-2">
                                                    <div className="flex gap-2">
                                                        <button type="button" className="rounded border border-slate-200 px-2 py-1 text-xs" onClick={() => setForEdit(line)}>Edit</button>
                                                        {can.manage && <button type="button" className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-700" onClick={() => deleteLine(line.id)}>Delete</button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50 font-semibold">
                                            <td colSpan={3} className="px-3 py-2 text-right">Total</td>
                                            <td className="px-3 py-2 text-right">{money(voucher.total_debit)}</td>
                                            <td className="px-3 py-2 text-right">{money(voucher.total_credit)}</td>
                                            <td className="px-3 py-2" />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <Modal show={showAccountModal} onClose={() => setShowAccountModal(false)} maxWidth="2xl">
                <div className="p-5">
                    <h3 className="text-lg font-semibold text-slate-900">Select account</h3>
                    <div className="mt-3 max-h-[420px] overflow-auto rounded border border-slate-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-3 py-2">Account</th>
                                    <th className="px-3 py-2">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((account) => (
                                    <tr
                                        key={`pick-${account.id}`}
                                        className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                                        onClick={() => {
                                            form.setData('voucher_account_id', account.id);
                                            if (!form.data.description) {
                                                form.setData('description', account.name);
                                            }
                                            setShowAccountModal(false);
                                        }}
                                    >
                                        <td className="px-3 py-2 font-semibold text-slate-900">{account.code}</td>
                                        <td className="px-3 py-2">{account.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
