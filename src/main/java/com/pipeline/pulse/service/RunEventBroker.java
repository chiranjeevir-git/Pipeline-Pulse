package com.pipeline.pulse.service;

import com.pipeline.pulse.domain.Run;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class RunEventBroker {

    private final Map<String, CopyOnWriteArrayList<SseEmitter>> subscribers = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String runId) {
        SseEmitter emitter = new SseEmitter(0L);
        CopyOnWriteArrayList<SseEmitter> bucket = subscribers.computeIfAbsent(runId, ignored -> new CopyOnWriteArrayList<>());
        bucket.add(emitter);
        Runnable cleanup = () -> {
            bucket.remove(emitter);
            if (bucket.isEmpty()) {
                subscribers.remove(runId, bucket);
            }
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(error -> cleanup.run());
        return emitter;
    }

    public void publish(Run run) {
        CopyOnWriteArrayList<SseEmitter> bucket = subscribers.get(run.getId());
        if (bucket == null || bucket.isEmpty()) {
            return;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("status", run.getStatus().getValue());
        payload.put("finishedAt", run.getFinishedAt());
        payload.put("durationMs", run.getDurationMs());
        for (SseEmitter emitter : bucket) {
            try {
                emitter.send(SseEmitter.event().name("status").data(payload));
            } catch (IOException | IllegalStateException ex) {
                emitter.complete();
                bucket.remove(emitter);
            }
        }
        if (bucket.isEmpty()) {
            subscribers.remove(run.getId(), bucket);
        }
    }
}
