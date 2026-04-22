import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';

const inputClasses =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500';

const today = () => new Date().toISOString().slice(0, 10);

const money = (value) =>
    Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export default function VoucherEntry({
    voucherTypes = [],
    selectedVoucher = null,
    voucherDetails = [],
    voucherList = [],
    pendingVouchers = [],
    navigation = {},
    can = {},
}) {
    const selectedType = voucherTypes.find((type) => type.value === selectedVoucher?.voucher_type);

    const form = useForm({
        voucher_type: selectedVoucher?.voucher_type ?? voucherTypes[0]?.value ?? 'JV',
        voucher_no: selectedVoucher?.voucher_no ?? selectedType?.next ?? voucherTypes[0]?.next ?? '',
        entry_date: selectedVoucher?.entry_date ?? today(),
        financial_year: selectedVoucher?.financial_year ?? new Date().getFullYear(),
        period: selectedVoucher?.period ?? String(new Date().getMonth() + 1),
        reference: selectedVoucher?.reference ?? '',
        description: selectedVoucher?.description ?? '',
        payment_type: selectedVoucher?.payment_type ?? 'cash',
        cheque_bank_name: selectedVoucher?.cheque_bank_name ?? '',
        cheque_no: selectedVoucher?.cheque_no ?? '',
        cheque_date: selectedVoucher?.cheque_date ?? '',
        status: selectedVoucher?.status ?? 'draft',
    });

    const onVoucherTypeChange = (value) => {
        const option = voucherTypes.find((type) => type.value === value);
        form.setData({
            ...form.data,
            voucher_type: value,
            voucher_no: selectedVoucher ? form.data.voucher_no : option?.next ?? form.data.voucher_no,
        });
    };

    const clearForm = () => {
        form.reset();
        form.setData({
            voucher_type: voucherTypes[0]?.value ?? 'JV',
            voucher_no: voucherTypes[0]?.next ?? '',
            entry_date: today(),
            financial_year: new Date().getFullYear(),
            period: String(new Date().getMonth() + 1),
            reference: '',
            description: '',
            payment_type: 'cash',
            cheque_bank_name: '',
            cheque_no: '',
            cheque_date: '',
            status: 'draft',
        });

        if (selectedVoucher) {
            router.get(route('finance.vouchers.index'));
        }
    };

    const addVoucher = () => {
        form.post(route('finance.vouchers.store'), {
            preserveScroll: true,
        });
    };

    const updateVoucher = () => {
        if (!selectedVoucher) {
            return;
        }

        form.put(route('finance.vouchers.update', selectedVoucher.id), {
            preserveScroll: true,
        });
    };

    const deleteVoucher = () => {
        if (!selectedVoucher) {
            return;
        }

        router.delete(route('finance.vouchers.destroy', selectedVoucher.id), {
            preserveScroll: true,
        });
    };

    const openSelected = (voucherId) => {
        router.get(route('finance.vouchers.index', { selected: voucherId }));
    };

    const showCheque = form.data.payment_type === 'cheque' || form.data.payment_type === 'bank';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Voucher Entry</h2>
                    <p className="text-sm text-gray-500">Header entry first, then open voucher details entry as separate step.</p>
                </div>
            }
        >
            <Head title="Voucher Entry" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        {can.manage && <PrimaryButton type="button" onClick={addVoucher}>Add</PrimaryButton>}
                        <SecondaryButton type="button" disabled={!selectedVoucher} onClick={() => selectedVoucher && router.get(route('finance.vouchers.details', selectedVoucher.id))}>Details</SecondaryButton>
                        {can.manage && <PrimaryButton type="button" disabled={!selectedVoucher} onClick={updateVoucher}>Update</PrimaryButton>}
                        {can.manage && <SecondaryButton type="button" disabled={!selectedVoucher} onClick={deleteVoucher}>Delete</SecondaryButton>}
                        <SecondaryButton type="button" onClick={clearForm}>Clear</SecondaryButton>
                        <SecondaryButton type="button" disabled={!navigation.next_id} onClick={() => navigation.next_id && openSelected(navigation.next_id)}>Next</SecondaryButton>
                        <SecondaryButton type="button" disabled={!navigation.previous_id} onClick={() => navigation.previous_id && openSelected(navigation.previous_id)}>Previous</SecondaryButton>
                        <SecondaryButton type="button" disabled={!selectedVoucher} onClick={() => selectedVoucher && window.open(selectedVoucher.print_url, '_blank')}>Print</SecondaryButton>
                        <SecondaryButton type="button" disabled={!selectedVoucher} onClick={() => selectedVoucher && window.open(selectedVoucher.pdf_url, '_blank')}>Print PDF</SecondaryButton>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="space-y-3">
                                <div>
                                    <InputLabel value="Voucher Type" />
                                    <select className={inputClasses} value={form.data.voucher_type} onChange={(e) => onVoucherTypeChange(e.target.value)} disabled={!can.manage}>
                                        {voucherTypes.map((type) => (
                                            <option key={type.value} value={type.value}>{type.value} - {type.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={form.errors.voucher_type} className="mt-1" />
                                </div>

                                <div className="grid grid-cols-[1fr_auto] gap-2">
                                    <div>
                                        <InputLabel value="Voucher Number" />
                                        <TextInput className={inputClasses} value={form.data.voucher_no} onChange={(e) => form.setData('voucher_no', e.target.value)} disabled={!can.manage || Boolean(selectedVoucher)} />
                                        <InputError message={form.errors.voucher_no} className="mt-1" />
                                    </div>
                                    <div className="pt-7">
                                        <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600" disabled>Last No.</button>
                                    </div>
                                </div>

                                <div>
                                    <InputLabel value="Entry Date" />
                                    <TextInput type="date" className={inputClasses} value={form.data.entry_date} onChange={(e) => form.setData('entry_date', e.target.value)} disabled={!can.manage} />
                                    <InputError message={form.errors.entry_date} className="mt-1" />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <InputLabel value="Financial Year" />
                                        <TextInput type="number" className={inputClasses} value={form.data.financial_year} onChange={(e) => form.setData('financial_year', e.target.value)} disabled={!can.manage} />
                                    </div>
                                    <div>
                                        <InputLabel value="Period" />
                                        <TextInput className={inputClasses} value={form.data.period} onChange={(e) => form.setData('period', e.target.value)} disabled={!can.manage} />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel value="Reference" />
                                    <TextInput className={inputClasses} value={form.data.reference} onChange={(e) => form.setData('reference', e.target.value)} disabled={!can.manage} />
                                </div>

                                <div>
                                    <InputLabel value="Description" />
                                    <textarea className={inputClasses} rows={2} value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} disabled={!can.manage} />
                                </div>

                                <div>
                                    <InputLabel value="Payment Type" />
                                    <select className={inputClasses} value={form.data.payment_type} onChange={(e) => form.setData('payment_type', e.target.value)} disabled={!can.manage}>
                                        <option value="cash">Cash</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="bank">Bank</option>
                                    </select>
                                </div>

                                {showCheque && (
                                    <>
                                        <div>
                                            <InputLabel value="Cheque Bank Name" />
                                            <TextInput className={inputClasses} value={form.data.cheque_bank_name} onChange={(e) => form.setData('cheque_bank_name', e.target.value)} disabled={!can.manage} />
                                        </div>
                                        <div>
                                            <InputLabel value="Cheque No." />
                                            <TextInput className={inputClasses} value={form.data.cheque_no} onChange={(e) => form.setData('cheque_no', e.target.value)} disabled={!can.manage} />
                                        </div>
                                        <div>
                                            <InputLabel value="Cheque Date" />
                                            <TextInput type="date" className={inputClasses} value={form.data.cheque_date} onChange={(e) => form.setData('cheque_date', e.target.value)} disabled={!can.manage} />
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <InputLabel value="Status" />
                                        <TextInput className={inputClasses} value={selectedVoucher?.status_label ?? 'Details Blank'} readOnly />
                                    </div>
                                    <div>
                                        <InputLabel value="Entered & Updated By" />
                                        <TextInput className={inputClasses} value={selectedVoucher?.created_by_name ?? '-'} readOnly />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                                <div className="bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Pending Voucher</div>
                                <table className="min-w-full text-xs">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-2 py-2 text-left">Voucher No</th>
                                            <th className="px-2 py-2 text-left">Date</th>
                                            <th className="px-2 py-2 text-left">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingVouchers.length === 0 ? (
                                            <tr><td className="px-2 py-2 text-slate-400" colSpan={3}>No pending voucher.</td></tr>
                                        ) : pendingVouchers.map((voucher) => (
                                            <tr key={`pending-${voucher.id}`} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => openSelected(voucher.id)}>
                                                <td className="px-2 py-2">{voucher.voucher_no}</td>
                                                <td className="px-2 py-2">{voucher.entry_date}</td>
                                                <td className="px-2 py-2">{voucher.description || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                                Details Blank Voucher
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-900">Voucher Details {selectedVoucher ? `For ${selectedVoucher.voucher_no}` : ''}</h3>
                                <div className="mt-3 overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2">Row</th>
                                                <th className="px-3 py-2">Account No.</th>
                                                <th className="px-3 py-2">Description</th>
                                                <th className="px-3 py-2">Sub Account</th>
                                                <th className="px-3 py-2">Sub Description</th>
                                                <th className="px-3 py-2 text-right">Debit</th>
                                                <th className="px-3 py-2 text-right">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {voucherDetails.length === 0 ? (
                                                <tr><td colSpan={7} className="px-3 py-3 text-slate-400">No voucher details yet. Use Details to add rows.</td></tr>
                                            ) : voucherDetails.map((row) => (
                                                <tr key={row.id} className="border-t border-slate-100">
                                                    <td className="px-3 py-2">{row.row_no}</td>
                                                    <td className="px-3 py-2">{row.account_no || '-'}</td>
                                                    <td className="px-3 py-2">{row.description || '-'}</td>
                                                    <td className="px-3 py-2">{row.sub_account || '-'}</td>
                                                    <td className="px-3 py-2">{row.sub_description || '-'}</td>
                                                    <td className="px-3 py-2 text-right">{money(row.debit)}</td>
                                                    <td className="px-3 py-2 text-right">{money(row.credit)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-50 font-semibold">
                                                <td className="px-3 py-2 text-right" colSpan={5}>Total:</td>
                                                <td className="px-3 py-2 text-right">{money(selectedVoucher?.total_debit || 0)}</td>
                                                <td className="px-3 py-2 text-right">{money(selectedVoucher?.total_credit || 0)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-900">Voucher List</h3>
                                <div className="mt-3 overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2">Voucher No.</th>
                                                <th className="px-3 py-2">Entry Date</th>
                                                <th className="px-3 py-2">Description</th>
                                                <th className="px-3 py-2">Reference</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {voucherList.map((row) => (
                                                <tr key={row.id} className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${selectedVoucher?.id === row.id ? 'bg-indigo-50' : ''}`} onClick={() => openSelected(row.id)}>
                                                    <td className="px-3 py-2 font-semibold">{row.voucher_no}</td>
                                                    <td className="px-3 py-2">{row.entry_date}</td>
                                                    <td className="px-3 py-2">{row.description || '-'}</td>
                                                    <td className="px-3 py-2">{row.reference || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="text-sm text-slate-500">
                                Need to maintain account codes first? <Link href={route('finance.chart-of-accounts.index')} className="font-semibold text-indigo-600">Open V2 Chart of Accounts</Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
