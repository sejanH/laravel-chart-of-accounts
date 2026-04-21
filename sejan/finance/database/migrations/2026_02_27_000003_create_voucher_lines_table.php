<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voucher_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('voucher_id')->constrained('vouchers')->cascadeOnDelete();
            $table->unsignedInteger('row_no');
            $table->foreignId('voucher_account_id')->constrained('voucher_accounts')->restrictOnDelete();
            $table->string('description', 255)->nullable();
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->string('remarks', 255)->nullable();
            $table->timestamps();

            $table->unique(['voucher_id', 'row_no']);
            $table->index(['voucher_account_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voucher_lines');
    }
};
