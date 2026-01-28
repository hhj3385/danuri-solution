package kr.go.danuri.admin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

/**
 * Ticket Controller
 * SR(티켓) 관리 컨트롤러
 */
@Controller
@RequestMapping("/tickets")
public class TicketController {

    @GetMapping
    public String list(Model model,
                       @RequestParam(required = false) String status,
                       @RequestParam(required = false) String siteId) {
        // TODO: 티켓 목록 조회
        model.addAttribute("title", "SR 관리");
        return "tickets/list";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable String id, Model model) {
        // TODO: 티켓 상세 조회
        model.addAttribute("title", "SR 상세");
        model.addAttribute("ticketId", id);
        return "tickets/detail";
    }

    @PostMapping("/{id}/assign")
    public String assign(@PathVariable String id, @RequestParam String assignee) {
        // TODO: 담당자 배정
        return "redirect:/admin/tickets/" + id;
    }

    @PostMapping("/{id}/resolve")
    public String resolve(@PathVariable String id, @RequestParam String resolution) {
        // TODO: 티켓 해결 처리
        return "redirect:/admin/tickets/" + id;
    }
}
