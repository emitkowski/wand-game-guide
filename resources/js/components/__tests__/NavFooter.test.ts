import { mount } from '@vue/test-utils';
import { Folder } from '@lucide/vue';
import { describe, expect, it } from 'vitest';
import NavFooter from '@/components/NavFooter.vue';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const items: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/vue-starter-kit',
        icon: Folder,
    },
];

function mountWithSidebar(props: { items: NavItem[]; class?: string }) {
    return mount(
        {
            components: { SidebarProvider, NavFooter },
            props: ['items', 'navClass'],
            template:
                '<SidebarProvider><NavFooter :items="items" :class="navClass" /></SidebarProvider>',
        },
        { props: { items: props.items, navClass: props.class } },
    );
}

describe('NavFooter', () => {
    it('renders each item as an external link with its href, target, and title', () => {
        const wrapper = mountWithSidebar({ items });

        const link = wrapper.find('a');
        expect(link.attributes('href')).toBe(
            'https://github.com/laravel/vue-starter-kit',
        );
        expect(link.attributes('target')).toBe('_blank');
        expect(link.attributes('rel')).toBe('noopener noreferrer');
        expect(link.text()).toContain('Repository');
    });

    it('renders one link per item', () => {
        const wrapper = mountWithSidebar({
            items: [
                ...items,
                {
                    title: 'Documentation',
                    href: 'https://laravel.com/docs/starter-kits#vue',
                    icon: Folder,
                },
            ],
        });

        expect(wrapper.findAll('a')).toHaveLength(2);
    });

    it('forwards a custom class to the SidebarGroup root', () => {
        const wrapper = mountWithSidebar({ items, class: 'mt-auto' });

        expect(wrapper.find('[data-sidebar="group"]').classes()).toContain(
            'mt-auto',
        );
    });
});
