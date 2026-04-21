<?php

namespace Sejan\Finance\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'voucher_no',
        'voucher_type',
        'entry_date',
        'financial_year',
        'period',
        'reference',
        'description',
        'payment_type',
        'cheque_bank_name',
        'cheque_no',
        'cheque_date',
        'status',
        'total_debit',
        'total_credit',
        'created_by',
        'approved_by',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'cheque_date' => 'date',
        'total_debit' => 'decimal:2',
        'total_credit' => 'decimal:2',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(VoucherLine::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
