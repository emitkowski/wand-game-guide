import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Link: {
        props: ['href', 'as'],
        template: '<a :href="href" :data-as="as"><slot /></a>',
    },
    router: { flushAll: vi.fn() },
    usePage: () => ({
        props: {
            auth: {
                user: {
                    id: 1,
                    name: 'Harry Potter',
                    email: 'harry@hogwarts.test',
                    email_verified_at: '2024-01-01T00:00:00.000000Z',
                    created_at: '2024-01-01T00:00:00.000000Z',
                    updated_at: '2024-01-01T00:00:00.000000Z',
                },
            },
        },
    }),
}));

vi.mock('@/routes', () => ({
    logout: () => '/logout',
}));

vi.mock('@/routes/profile', () => ({
    edit: () => '/settings/profile',
}));

import NavUser from '@/components/NavUser.vue';
import { SidebarProvider } from '@/components/ui/sidebar';

function mountWithSidebar() {
    return mount(
        {
            components: { SidebarProvider, NavUser },
            template: '<SidebarProvider><NavUser /></SidebarProvider>',
        },
        { attachTo: document.body },
    );
}

describe('NavUser', () => {
    it("renders the current user's info in the sidebar menu trigger", () => {
        const wrapper = mountWithSidebar();

        const trigger = wrapper.find('[data-test="sidebar-menu-button"]');
        expect(trigger.exists()).toBe(true);
        expect(trigger.text()).toContain('Harry Potter');

        wrapper.unmount();
    });

    it('opens a dropdown menu on click that shows the user menu content for the current user', async () => {
        const wrapper = mountWithSidebar();

        await wrapper
            .find('[data-test="sidebar-menu-button"]')
            .trigger('click');
        await wrapper.vm.$nextTick();

        expect(document.body.textContent).toContain('harry@hogwarts.test');
        expect(document.body.textContent).toContain('Settings');
        expect(document.body.textContent).toContain('Log out');

        wrapper.unmount();
    });
});
