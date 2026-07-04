<?php

use App\Http\Controllers\API\LeaderController;
use App\Http\Controllers\API\PlayerController;
use App\Http\Controllers\API\QuizController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ===== PLAYER =====
    Route::post('/player/register', [PlayerController::class, 'register']);
    Route::get('/player/check', [PlayerController::class, 'check']);
    Route::put('/player/name', [PlayerController::class, 'updateName']);
    Route::get('/player/info', [PlayerController::class, 'getInfo']);
    Route::get('/player/badges', [PlayerController::class, 'getBadges']);

    // ===== GAME DATA =====
    Route::get('/scenarios', [QuizController::class, 'getScenarios']);
    Route::get('/quiz-questions', [QuizController::class, 'getQuestions']);
    Route::get('/road-signs', [QuizController::class, 'getRoadSigns']);
    Route::get('/road-signs/random/{count}', [QuizController::class, 'getRandomRoadSigns']);
    Route::get('/law-articles', [QuizController::class, 'getLawArticles']);

    // ===== GAME ACTIONS =====
    Route::post('/quiz/submit', [QuizController::class, 'submitAnswer']);
    Route::post('/quiz/end', [QuizController::class, 'endSession']);

    // ===== LEADERBOARD =====
    Route::get('/leaderboard', [LeaderController::class, 'index']);
});
