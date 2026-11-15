export default function manifest() {
  return {
    name: 'Leeting • Habit & Focus Companion for LeetCode Engineers',
    short_name: 'Leeting',
    description: 'Next-generation desktop companion and habit controller for LeetCode engineers.',
    start_url: '/',
    display: 'standalone',
    background_color: '#08090d',
    theme_color: '#ffa116',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
