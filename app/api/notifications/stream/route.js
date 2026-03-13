import { systemEvents, EVENTS } from '@/lib/events';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Server-Sent Events (SSE) Route for real-time notifications.
 * Removes the need for polling.
 */
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            const sendEvent = (data) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            // Heartbeat to keep connection alive
            const heartbeat = setInterval(() => {
                controller.enqueue(encoder.encode(': heartbeat\n\n'));
            }, 30000);

            // Listener function
            const onNotification = (data) => {
                if (data.recipientId === userId) {
                    sendEvent({ type: 'notification', payload: data.notification });
                }
            };

            // Subscribe to event bus
            systemEvents.on(EVENTS.NOTIFICATION_CREATED, onNotification);

            // Cleanup when stream closes
            req.signal.addEventListener('abort', () => {
                clearInterval(heartbeat);
                systemEvents.off(EVENTS.NOTIFICATION_CREATED, onNotification);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
