import { h } from 'vue';

export type FormTestState = {
    errors: Record<string, string>;
    processing: boolean;
};

export function freshFormTestState(): FormTestState {
    return { errors: {}, processing: false };
}

/**
 * Builds a stand-in for Inertia's real <Form> component (which makes a live
 * network request on submit) bound to a mutable state object. Renders a
 * plain <form> (submit prevented) and forwards the default slot with the
 * current errors/processing — real <Form> exposes the same slot shape (plus
 * clearErrors/reset), see https://inertiajs.com/forms#form-component.
 *
 * Usage — `state` must come from `vi.hoisted()` so it's available inside a
 * `vi.mock('@inertiajs/vue3', ...)` factory, which Vitest hoists above
 * normal imports:
 *
 *   const formTestState = vi.hoisted(() => freshFormTestState());
 *   vi.mock('@inertiajs/vue3', async (importOriginal) => ({
 *       ...(await importOriginal()),
 *       Form: createFormStub(formTestState),
 *   }));
 *   beforeEach(() => Object.assign(formTestState, freshFormTestState()));
 *   // then, per test: formTestState.errors = { email: '...' };
 */
export function createFormStub(state: FormTestState) {
    return {
        name: 'Form',
        inheritAttrs: false,
        setup(_props: Record<string, unknown>, { slots, attrs }: any) {
            return () =>
                h(
                    'form',
                    { ...attrs, onSubmit: (e: Event) => e.preventDefault() },
                    slots.default?.({
                        errors: state.errors,
                        processing: state.processing,
                        clearErrors: () => {},
                        reset: () => {},
                        wasSuccessful: false,
                        recentlySuccessful: false,
                    }),
                );
        },
    };
}
