<?php

use Illuminate\Support\Facades\Route;
use Sejan\Finance\Http\Controllers\AccountController;
use Sejan\Finance\Http\Controllers\JournalEntryController;
use Sejan\Finance\Http\Controllers\JournalEntryLineController;
use Sejan\Finance\Http\Controllers\AccountingLedgerController;

// Finance API Routes with permission middleware
Route::middleware(['auth:sanctum'])->prefix('finance')->name('finance.api.')->group(function () {
    // Accounts - Read (requires finance.read or finance.manage)
    Route::middleware(['finance.permission:finance.read'])->group(function () {
        Route::get('/accounts', [AccountController::class, 'index'])->name('accounts.index');
        Route::get('/accounts/{account}', [AccountController::class, 'show'])->name('accounts.show');
    });

    // Accounts - Create/Update/Delete (requires finance.manage)
    Route::middleware(['finance.permission:finance.manage'])->group(function () {
        Route::post('/accounts', [AccountController::class, 'store'])->name('accounts.store');
        Route::put('/accounts/{account}', [AccountController::class, 'update'])->name('accounts.update');
        Route::delete('/accounts/{account}', [AccountController::class, 'destroy'])->name('accounts.destroy');
    });

    // Journal Entries - Read (requires finance.read or finance.manage)
    Route::middleware(['finance.permission:finance.read'])->group(function () {
        Route::get('/journal-entries', [JournalEntryController::class, 'index'])->name('journal-entries.index');
        Route::get('/journal-entries/{journalEntry}', [JournalEntryController::class, 'show'])->name('journal-entries.show');
    });

    // Journal Entries - Create/Update/Delete (requires finance.manage)
    Route::middleware(['finance.permission:finance.manage'])->group(function () {
        Route::post('/journal-entries', [JournalEntryController::class, 'store'])->name('journal-entries.store');
        Route::put('/journal-entries/{journalEntry}', [JournalEntryController::class, 'update'])->name('journal-entries.update');
        Route::delete('/journal-entries/{journalEntry}', [JournalEntryController::class, 'destroy'])->name('journal-entries.destroy');
    });

    // Journal Entry Lines - Read (requires finance.read or finance.manage)
    Route::middleware(['finance.permission:finance.read'])->group(function () {
        Route::get('/journal-entry-lines', [JournalEntryLineController::class, 'index'])->name('journal-entry-lines.index');
        Route::get('/journal-entry-lines/{journalEntryLine}', [JournalEntryLineController::class, 'show'])->name('journal-entry-lines.show');
    });

    // Journal Entry Lines - Create/Update/Delete (requires finance.manage)
    Route::middleware(['finance.permission:finance.manage'])->group(function () {
        Route::post('/journal-entry-lines', [JournalEntryLineController::class, 'store'])->name('journal-entry-lines.store');
        Route::put('/journal-entry-lines/{journalEntryLine}', [JournalEntryLineController::class, 'update'])->name('journal-entry-lines.update');
        Route::delete('/journal-entry-lines/{journalEntryLine}', [JournalEntryLineController::class, 'destroy'])->name('journal-entry-lines.destroy');
    });

    // Accounting Ledger - Read (requires finance.read or finance.manage)
    Route::middleware(['finance.permission:finance.read'])->group(function () {
        Route::get('/accounting-ledger', [AccountingLedgerController::class, 'index'])->name('ledger.index');
    });
});
