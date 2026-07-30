import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom latency & health metrics
const wsMessageLatency = new Trend('ws_message_latency_ms');
const wsConnectTime = new Trend('ws_connect_time_ms');
const wsErrors = new Counter('ws_errors');

export const options = {
  stages: [
    { duration: '10s', target: 15 }, // Ramp up to 15 concurrent VUs
    { duration: '20s', target: 30 }, // Hold steady at 30 concurrent VUs
    { duration: '10s', target: 0 },  // Ramp down to 0
  ],
  thresholds: {
    'ws_message_latency_ms': ['p(95)<300'], // P95 latency must be under 300ms
    'checks': ['rate>0.95'],                 // 95%+ successful handshakes
  },
};

export default function () {
  const roomId = 'k6-benchmark-room';
  const userId = `vu_user_${__VU}_${__ITER}`;
  const url = `ws://127.0.0.1:8080/ws/chat/${roomId}?user_id=${userId}&display_name=k6_VU_${__VU}&language=en`;

  const startTime = Date.now();

  const response = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      wsConnectTime.add(Date.now() - startTime);

      // Send chat message every 2.5 seconds
      socket.setInterval(() => {
        const sendTs = Date.now();
        const payload = JSON.stringify({
          type: 'message',
          text: `Benchmark pulse from VU ${__VU} at ${sendTs}`,
        });

        socket.send(payload);
      }, 2500);
    });

    socket.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'message' && msg.payload && msg.payload.timestamp) {
          const sentTs = new Date(msg.payload.timestamp).getTime();
          const latency = Date.now() - sentTs;
          if (latency >= 0) {
            wsMessageLatency.add(latency);
          }
        }
      } catch (err) {
        wsErrors.add(1);
      }
    });

    socket.on('error', () => {
      wsErrors.add(1);
    });

    // Each VU maintains connection for 12 seconds
    socket.setTimeout(() => {
      socket.close();
    }, 12000);
  });

  check(response, {
    'WebSocket connection handshake status is 101': (r) => r && r.status === 101,
  });

  sleep(1);
}