package com.av.Av;

import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

@Component
public class ApiRequestCounter {

    private final AtomicLong get = new AtomicLong();
    private final AtomicLong post = new AtomicLong();
    private final AtomicLong put = new AtomicLong();

    public void count(String method) {

        switch (method.toUpperCase()) {

            case "GET":
                get.incrementAndGet();
                break;

            case "POST":
                post.incrementAndGet();
                break;

            case "PUT":
                put.incrementAndGet();
                break;
        }
    }

    public long getGet() {
        return get.get();
    }

    public long getPost() {
        return post.get();
    }

    public long getPut() {
        return put.get();
    }

    public void reset() {
        get.set(0);
        post.set(0);
        put.set(0);
    }
}