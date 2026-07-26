import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AlertError from '@/components/AlertError.vue';

describe('AlertError', () => {
    it('shows the default title when none is provided', () => {
        const wrapper = mount(AlertError, {
            props: { errors: ['Something failed'] },
        });

        expect(wrapper.text()).toContain('Something went wrong.');
    });

    it('shows a custom title when provided', () => {
        const wrapper = mount(AlertError, {
            props: { errors: ['Something failed'], title: 'Upload failed' },
        });

        expect(wrapper.text()).toContain('Upload failed');
        expect(wrapper.text()).not.toContain('Something went wrong.');
    });

    it('renders one list item per error', () => {
        const wrapper = mount(AlertError, {
            props: { errors: ['First error', 'Second error'] },
        });

        const items = wrapper.findAll('li');
        expect(items).toHaveLength(2);
        expect(items[0].text()).toBe('First error');
        expect(items[1].text()).toBe('Second error');
    });

    it('deduplicates repeated error messages', () => {
        const wrapper = mount(AlertError, {
            props: { errors: ['Duplicate', 'Duplicate', 'Unique'] },
        });

        expect(wrapper.findAll('li')).toHaveLength(2);
    });

    it('renders no list items when given an empty errors array', () => {
        const wrapper = mount(AlertError, { props: { errors: [] } });

        expect(wrapper.findAll('li')).toHaveLength(0);
    });
});
