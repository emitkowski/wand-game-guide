import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import InputError from '@/components/InputError.vue';

describe('InputError', () => {
    it('renders the message text when provided', () => {
        const wrapper = mount(InputError, {
            props: { message: 'The email field is required.' },
        });

        expect(wrapper.text()).toContain('The email field is required.');
        expect(wrapper.find('div').isVisible()).toBe(true);
    });

    it('hides itself (v-show) when no message is provided', () => {
        const wrapper = mount(InputError);

        expect(wrapper.find('div').isVisible()).toBe(false);
    });
});
