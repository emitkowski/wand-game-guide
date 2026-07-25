<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameGuideController extends Controller
{
    /**
     * Show the player's Game Guide chat.
     */
    public function index(Request $request): Response
    {
        $conversation = $request->user()->conversations()->first()
            ?? $request->user()->conversations()->create();

        return Inertia::render('game-guide/Chat', [
            'conversationId' => $conversation->id,
        ]);
    }
}
