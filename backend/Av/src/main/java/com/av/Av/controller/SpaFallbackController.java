package com.av.Av.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaFallbackController {

    @RequestMapping(value = "/{path:^(?!(?i:apiav))(?!index\\.html).*$}/**")
    public String redirect() {
        return "forward:/index.html";
    }
}