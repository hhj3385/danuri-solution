package kr.go.danuri.admin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

/**
 * Site Controller
 * 외부 사이트(테넌트) 관리 컨트롤러
 */
@Controller
@RequestMapping("/sites")
public class SiteController {

    @GetMapping
    public String list(Model model) {
        // TODO: 사이트 목록 조회
        model.addAttribute("title", "사이트 관리");
        return "sites/list";
    }

    @GetMapping("/new")
    public String newSite(Model model) {
        model.addAttribute("title", "사이트 등록");
        return "sites/form";
    }

    @PostMapping
    public String create(@ModelAttribute SiteForm form) {
        // TODO: 사이트 생성 + API 키 발급
        return "redirect:/admin/sites";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable String id, Model model) {
        // TODO: 사이트 상세 조회
        model.addAttribute("title", "사이트 상세");
        model.addAttribute("siteId", id);
        return "sites/detail";
    }

    @GetMapping("/{id}/keys")
    public String keys(@PathVariable String id, Model model) {
        // TODO: API 키 목록 조회
        model.addAttribute("title", "API 키 관리");
        model.addAttribute("siteId", id);
        return "sites/keys";
    }

    @PostMapping("/{id}/keys/generate")
    public String generateKey(@PathVariable String id, @RequestParam String keyType) {
        // TODO: 새 API 키 생성
        return "redirect:/admin/sites/" + id + "/keys";
    }

    // Inner class for form binding
    public static class SiteForm {
        private String name;
        private String domain;
        private String description;

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDomain() { return domain; }
        public void setDomain(String domain) { this.domain = domain; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
