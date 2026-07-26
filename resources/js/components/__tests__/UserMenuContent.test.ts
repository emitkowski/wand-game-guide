import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Link: {
        props: ['href', 'as'],
        template:
            '<a :href="href" :data-as="as" @click="$emit(\'click\')"><slot /></a>',
    },
    router: { flushAll: vi.fn() },
}));

vi.mock('@/routes', () => ({
    logout: () => '/logout',
}));

vi.mock('@/routes/profile', () => ({
    edit: () => '/settings/profile',
}));

import { router } from '@inertiajs/vue3';
import UserMenuContent from '@/components/UserMenuContent.vue';
import { DropdownMenu, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import type { User } from '@/types';

const user: User = {
    id: 1,
    name: 'Harry Potter',
    email: 'harry@hogwarts.test',
    email_verified_at: '2024-01-01T00:00:00.000000Z',
    created_at: '2024-01-01T00:00:00.000000Z',
    updated_at: '2024-01-01T00:00:00.000000Z',
};

// UserMenuContent's DropdownMenuItem/DropdownMenuGroup children need reka-ui's
// MenuRoot/MenuContent context, and DropdownMenuContent teleports to
// document.body — so mount it inside a real, open DropdownMenu (mirroring
// how NavUser/AppHeader actually use it) and query the teleported DOM.
function mountInsideDropdown() {
    return mount(
        {
            components: { DropdownMenu, DropdownMenuContent, UserMenuContent },
            props: ['user'],
            template:
                '<DropdownMenu :open="true"><DropdownMenuContent><UserMenuContent :user="user" /></DropdownMenuContent></DropdownMenu>',
        },
        { props: { user }, attachTo: document.body },
    );
}

describe('UserMenuContent', () => {
    let wrapper: ReturnType<typeof mountInsideDropdown> | undefined;

    afterEach(() => {
        wrapper?.unmount();
        wrapper = undefined;
    });

    it("shows the user's name and email", async () => {
        wrapper = mountInsideDropdown();
        await flushPromises();

        expect(document.body.textContent).toContain('Harry Potter');
        expect(document.body.textContent).toContain('harry@hogwarts.test');
    });

    it('links to the settings/profile edit page', async () => {
        wrapper = mountInsideDropdown();
        await flushPromises();

        const settingsLink = Array.from(
            document.body.querySelectorAll('a'),
        ).find((link) => link.textContent?.includes('Settings'));

        expect(settingsLink?.getAttribute('href')).toBe('/settings/profile');
    });

    it('links to logout and flushes Inertia state when clicked', async () => {
        wrapper = mountInsideDropdown();
        await flushPromises();

        const logoutLink = Array.from(
            document.body.querySelectorAll('a'),
        ).find((link) => link.textContent?.includes('Log out'));

        expect(logoutLink?.getAttribute('href')).toBe('/logout');

        logoutLink!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(router.flushAll).toHaveBeenCalled();
    });
});
