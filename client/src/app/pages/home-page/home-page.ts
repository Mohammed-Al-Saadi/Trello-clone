import { Component } from '@angular/core';
import { Card } from '../../components/card/card';
import { LinkButton } from '../../components/link-button/link-button';
import { NgFor } from '@angular/common';
import { Footer } from '../../components/footer/footer';
import { Header } from '../../components/header/header';
import { StatsComponent } from '../../components/stats/stats';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [Card, LinkButton, StatsComponent],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css'],
})
export class HomePage {
  features = [
    {
      title: 'Lightning Fast',
      p: 'Instant updates and real-time collaboration',
      icon: 'smart_toy',
      type: 'material' as const,
      iconColor: '#C084FC',
      iconBgColor: '#2A143B',
    },
    {
      title: 'Team Focused',
      p: 'Collaborate effortlessly and stay organized.',
      icon: 'group',
      type: 'material' as const,
      iconColor: '#60A5FA',
      iconBgColor: '#122233',
    },
    {
      title: 'Secure & Private',
      p: 'Your data is protected with industry-grade encryption.',
      icon: 'lock',
      type: 'material' as const,
      iconColor: '#4ADE80',
      iconBgColor: '#102419',
    },
    {
      title: 'Smart AI',
      p: 'Powered by intelligent algorithms for better insights.',
      icon: 'smart_toy',
      type: 'material' as const,
      iconColor: '#F472B6',
      iconBgColor: '#331726',
    },
  ];

  test = [
    {
      title: 'Ready to Transform Your Workflow?',
      p: 'Join thousands of teams already using Trvolo to achieve their goals faster.',
      icon: '',
      type: 'material' as const,
      iconColor: '#9c27b0',
      iconBgColor: '#f3e5f5',
    },
  ];
  howItWorks = [
    {
      title: 'Sign Up or Log In',
      p: 'Create your account or sign in to access your personalized dashboard and projects.',
      icon: 'login',
      type: 'material' as const,
      iconColor: '#FB923C', // orange glow
      iconBgColor: '#2E1D0F', // dark orange base
    },
    {
      title: 'Create a Project',
      p: 'Start a new project in seconds, set your goals, and invite your team.',
      icon: 'folder_open',
      type: 'material' as const,
      iconColor: '#C084FC', // purple glow
      iconBgColor: '#2A143B', // deep purple
    },
    {
      title: 'Add Team Members',
      p: 'Collaborate with your teammates and assign roles for better workflow.',
      icon: 'group_add',
      type: 'material' as const,
      iconColor: '#60A5FA', // blue glow
      iconBgColor: '#122233', // dark blue
    },
    {
      title: 'Manage Tasks Visually',
      p: 'Organize your work with simple boards: To Do, In Progress, and Done.',
      icon: 'check_circle',
      type: 'material' as const,
      iconColor: '#4ADE80', // green glow
      iconBgColor: '#102419', // dark green
    },
  ];
  roleHighlights = [
    {
      title: 'Project Managers',
      p: 'Plan sprints, assign tasks, and monitor progress in real time.',
      icon: 'leaderboard',
      type: 'material' as const,
      iconColor: '#C084FC', // purple
      iconBgColor: '#2A143B',
    },
    {
      title: 'Developers',
      p: 'Track tasks effortlessly with clear visibility and integrations.',
      icon: 'code',
      type: 'material' as const,
      iconColor: '#60A5FA', // blue
      iconBgColor: '#122233',
    },
    {
      title: 'Designers',
      p: 'Collaborate visually and keep creative assets organized.',
      icon: 'brush',
      type: 'material' as const,
      iconColor: '#F472B6', // pink
      iconBgColor: '#331726',
    },
    {
      title: 'Teams',
      p: 'Stay aligned, communicate clearly, and move projects forward together.',
      icon: 'groups',
      type: 'material' as const,
      iconColor: '#4ADE80', // green
      iconBgColor: '#102419',
    },
  ];

  trustedCompany = ['NovaWorks', 'SkyLogic', 'PixelForge', 'NextVision', 'CloudAxis'];
}
