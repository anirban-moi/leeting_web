import { ImageResponse } from 'next/og';

export const alt = 'Leeting • Habit & Focus Companion for LeetCode Engineers';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #08090d 0%, #111520 50%, #08090d 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            background: 'rgba(255, 161, 22, 0.12)',
            borderRadius: '50%',
            filter: 'blur(120px)',
          }}
        />

        {/* Brand Container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ffa116 50%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 35px rgba(255, 161, 22, 0.4)',
            }}
          >
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="#090a0f"
              stroke="#090a0f"
              strokeWidth="1.5"
            >
              <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
            </svg>
          </div>
          <span
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-2px',
            }}
          >
            Leeting
          </span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              fontFamily: 'monospace',
            }}
          >
            v1.0.9
          </span>
        </div>

        {/* Main Heading */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: 800,
            color: '#f8fafc',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.3,
            marginBottom: '16px',
          }}
        >
          Habit & Focus Companion for LeetCode Engineers
        </div>

        {/* Tagline Feature Pills */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '8px',
          }}
        >
          <div
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              background: 'rgba(255, 161, 22, 0.12)',
              border: '1px solid rgba(255, 161, 22, 0.3)',
              color: '#ffa116',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            365-Day Consistency Matrix
          </div>
          <div
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#34d399',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            Top 19 Company Prep
          </div>
          <div
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            Pomodoro Focus Shield
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
