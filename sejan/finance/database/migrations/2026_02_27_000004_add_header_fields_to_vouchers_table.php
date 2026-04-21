<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->unsignedSmallInteger('financial_year')->nullable()->after('entry_date');
            $table->string('period', 20)->nullable()->after('financial_year');
            $table->string('cheque_bank_name', 150)->nullable()->after('payment_type');
            $table->string('cheque_no', 100)->nullable()->after('cheque_bank_name');
            $table->date('cheque_date')->nullable()->after('cheque_no');
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn(['financial_year', 'period', 'cheque_bank_name', 'cheque_no', 'cheque_date']);
        });
    }
};
