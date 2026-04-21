<?php

namespace Sejan\Finance\Http\Controllers;

use Sejan\Finance\Models\Voucher;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class VoucherPrintController extends Controller
{
    public function print(Voucher $voucher): Response
    {
        $voucher->load(['lines.account', 'createdBy', 'approvedBy']);

        return $this->render($voucher, false);
    }

    public function pdf(Voucher $voucher): Response
    {
        $voucher->load(['lines.account', 'createdBy', 'approvedBy']);

        return $this->render($voucher, true);
    }

    private function render(Voucher $voucher, bool $asPdf): Response
    {
        $data = [
            'voucher' => $voucher,
            'company' => [
                'name' => setting('company_name', config('app.name')),
                'address' => setting('company_address'),
                'phone' => setting('company_phone'),
                'email' => setting('company_email', config('mail.from.address')),
            ],
            'pdfUrl' => route('finance.v2.vouchers.pdf', $voucher->id),
            'isPdf' => $asPdf,
        ];

        if ($asPdf) {
            if (!class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
                abort(501, 'PDF rendering is not configured. Install barryvdh/laravel-dompdf.');
            }

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('print.v2-voucher', $data)
                ->setPaper('a4');

            return $pdf->download('voucher-'.$voucher->voucher_no.'.pdf');
        }

        return response()->view('print.v2-voucher', $data);
    }
}
