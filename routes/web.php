<?php

use App\Http\Controllers\GameGuideController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'Dashboard')->name('dashboard');

    Route::get('game-guide', [GameGuideController::class, 'index'])->name('game-guide.index');
});

require __DIR__.'/settings.php';
