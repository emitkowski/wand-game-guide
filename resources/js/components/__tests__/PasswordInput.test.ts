import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PasswordInput from '@/components/PasswordInput.vue';

describe('PasswordInput', () => {
    it('renders a password-type input by default', () => {
        const wrapper = mount(PasswordInput);

        expect(wrapper.find('input').attributes('type')).toBe('password');
    });

    it('toggles the input type to text when the show/hide button is clicked, and back again', async () => {
        const wrapper = mount(PasswordInput);

        const toggle = wrapper.find('button');
        expect(toggle.attributes('aria-label')).toBe('Show password');

        await toggle.trigger('click');

        expect(wrapper.find('input').attributes('type')).toBe('text');
        expect(toggle.attributes('aria-label')).toBe('Hide password');

        await toggle.trigger('click');

        expect(wrapper.find('input').attributes('type')).toBe('password');
        expect(toggle.attributes('aria-label')).toBe('Show password');
    });

    it('forwards attributes like placeholder through to the underlying input', () => {
        const wrapper = mount(PasswordInput, {
            attrs: { placeholder: 'Enter your password' },
        });

        expect(wrapper.find('input').attributes('placeholder')).toBe(
            'Enter your password',
        );
    });

    it('does not make the show/hide toggle tabbable', () => {
        const wrapper = mount(PasswordInput);

        expect(wrapper.find('button').attributes('tabindex')).toBe('-1');
    });
});
