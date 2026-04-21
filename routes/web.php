<?php

use Sejan\Finance\Http\Controllers\VoucherAccountController;
use Sejan\Finance\Http\Controllers\VoucherPrintController;
use Sejan\Finance\Http\Controllers\VoucherWorkflowController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth'])->prefix('finance')->name('finance.')->group(function () {
    // Voucher Workflow
    Route::get('/voucher-entry', [VoucherWorkflowController::class, 'index'])->name('vouchers.index');
    Route::get('/voucher-entry/{voucher}/details', [VoucherWorkflowController::class, 'details'])->name('vouchers.details');
    Route::get('/voucher-entry/{voucher}/print', [VoucherPrintController::class, 'print'])->name('vouchers.print');
    Route::get('/voucher-entry/{voucher}/pdf', [VoucherPrintController::class, 'pdf'])->name('vouchers.pdf');
    Route::get('/chart-of-accounts', [VoucherAccountController::class, 'index'])->name('chart-of-accounts.index');

    // Store/Update/Delete
    Route::post('/voucher-entry', [VoucherWorkflowController::class, 'store'])->name('vouchers.store');
    Route::put('/voucher-entry/{voucher}', [VoucherWorkflowController::class, 'update'])->name('vouchers.update');
    Route::delete('/voucher-entry/{voucher}', [VoucherWorkflowController::class, 'destroy'])->name('vouchers.destroy');
    Route::post('/voucher-entry/{voucher}/details', [VoucherWorkflowController::class, 'storeLine'])->name('vouchers.lines.store');
    Route::put('/voucher-entry/{voucher}/details/{voucherLine}', [VoucherWorkflowController::class, 'updateLine'])->name('vouchers.lines.update');
    Route::delete('/voucher-entry/{voucher}/details/{voucherLine}', [VoucherWorkflowController::class, 'destroyLine'])->name('vouchers.lines.destroy');

    Route::post('/chart-of-accounts', [VoucherAccountController::class, 'store'])->name('chart-of-accounts.store');
    Route::put('/chart-of-accounts/{voucherAccount}', [VoucherAccountController::class, 'update'])->name('chart-of-accounts.update');
    Route::delete('/chart-of-accounts/{voucherAccount}', [VoucherAccountController::class, 'destroy'])->name('chart-of-accounts.destroy');
});
