<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $password = Password::min(8)
            ->letters()
            ->mixedCase()
            ->numbers();

        // The compromised-password check calls an external service. Keep the
        // stronger production policy without making local registration depend
        // on internet availability.
        if (app()->isProduction()) {
            $password->uncompromised();
        }

        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            'device_name' => ['sometimes', 'string', 'max:255'],
            'terms_accepted' => ['required', 'accepted'],
            'password' => [
                'required',
                'string',
                'confirmed',
                $password,
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'password.confirmed' => 'The password confirmation does not match.',
        ];
    }
}
