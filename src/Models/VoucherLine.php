<?php

namespace Sejan\Finance\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoucherLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'voucher_id',
        'row_no',
        'voucher_account_id',
        'description',
        'debit',
        'credit',
        'entry_side',
        'remarks',
        'account_source',
        'sub_account_code',
        'sub_account_description',
    ];

    protected $casts = [
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
    ];

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(VoucherAccount::class, 'voucher_account_id');
    }
}
