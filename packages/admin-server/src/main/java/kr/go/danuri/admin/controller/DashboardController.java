package kr.go.danuri.admin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Dashboard Controller
 * 대시보드 화면 컨트롤러
 */
@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    @GetMapping
    public String dashboard(Model model) {
        // TODO: 통계 데이터 조회
        model.addAttribute("title", "DANURI 관리자 대시보드");
        return "dashboard/index";
    }
}
