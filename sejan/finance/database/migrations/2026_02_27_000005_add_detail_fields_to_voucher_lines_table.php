<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voucher_lines', function (Blueprint $table) {
            $table->enum('entry_side', ['debit', 'credit'])->default('debit')->after('credit');
            $table->string('account_source', 40)->nullable()->after('remarks');
            $table->string('sub_account_code', 80)->nullable()->after('account_source');
            $table->string('sub_account_description', 255)->nullable()->after('sub_account_code');
        });
    }

    public function down(): void
    {
        Schema::table('voucher_lines', function (Blueprint $table) {
            $table->dropColumn(['entry_side', 'account_source', 'sub_account_code', 'sub_account_description']);
        });
    }
};
