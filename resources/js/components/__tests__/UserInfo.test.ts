import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserInfo from '@/components/UserInfo.vue';
import { AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/types';

function user(overrides: Partial<User> = {}): User {
    return {
        id: 1,
        name: 'Harry Potter',
        email: 'harry@hogwarts.test',
        email_verified_at: '2024-01-01T00:00:00.000000Z',
        created_at: '2024-01-01T00:00:00.000000Z',
        updated_at: '2024-01-01T00:00:00.000000Z',
        ...overrides,
    };
}

describe('UserInfo', () => {
    it("renders the user's initials as the avatar fallback", () => {
        const wrapper = mount(UserInfo, { props: { user: user() } });

        expect(wrapper.find('[data-slot="avatar-fallback"]').text()).toBe(
            'HP',
        );
        expect(wrapper.text()).toContain('Harry Potter');
    });

    it('does not show the email by default', () => {
        const wrapper = mount(UserInfo, { props: { user: user() } });

        expect(wrapper.text()).not.toContain('harry@hogwarts.test');
    });

    it('shows the email when showEmail is true', () => {
        const wrapper = mount(UserInfo, {
            props: { user: user(), showEmail: true },
        });

        expect(wrapper.text()).toContain('harry@hogwarts.test');
    });

    it('does not render an AvatarImage when the user has no avatar', () => {
        const wrapper = mount(UserInfo, { props: { user: user() } });

        expect(wrapper.findComponent(AvatarImage).exists()).toBe(false);
    });

    it('renders an AvatarImage with the correct src/alt when the user has an avatar', () => {
        const wrapper = mount(UserInfo, {
            props: {
                user: user({ avatar: 'https://example.com/avatar.png' }),
            },
        });

        const image = wrapper.findComponent(AvatarImage);
        expect(image.exists()).toBe(true);
        expect(image.props('src')).toBe('https://example.com/avatar.png');
        expect(image.attributes('alt')).toBe('Harry Potter');
    });

    it('treats an empty-string avatar as "no avatar"', () => {
        const wrapper = mount(UserInfo, {
            props: { user: user({ avatar: '' }) },
        });

        expect(wrapper.findComponent(AvatarImage).exists()).toBe(false);
    });
});
