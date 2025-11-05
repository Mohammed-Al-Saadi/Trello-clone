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
      iconColor: '#9c27b0',
      iconBgColor: '#f3e5f5',
    },
    {
      title: 'Team Focused',
      p: 'Collaborate effortlessly and stay organized.',
      icon: 'group',
      type: 'material' as const,
      iconColor: '#0d81e0ff',
      iconBgColor: '#e3f2fd',
    },
    {
      title: 'Secure & Private',
      p: 'Your data is protected with industry-grade encryption.',
      icon: 'lock',
      type: 'material' as const,
      iconColor: '#4caf50',
      iconBgColor: '#e8f5e9',
    },

    {
      title: 'Smart AI',
      p: 'Powered by intelligent algorithms for better insights.',
      icon: 'smart_toy',
      type: 'material' as const,
      iconColor: '#9c27b0',
      iconBgColor: '#f3e5f5',
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
      iconColor: '#ff9800',
      iconBgColor: '#fff3e0',
    },
    {
      title: 'Create a Project',
      p: 'Start a new project in seconds, set your goals, and invite your team.',
      icon: 'folder_open',
      type: 'material' as const,
      iconColor: '#9c27b0',
      iconBgColor: '#f3e5f5',
    },
    {
      title: 'Add Team Members',
      p: 'Collaborate with your teammates and assign roles for better workflow.',
      icon: 'group_add',
      type: 'material' as const,
      iconColor: '#0288d1',
      iconBgColor: '#e1f5fe',
    },
    {
      title: 'Manage Tasks Visually',
      p: 'Organize your work with simple boards: To Do, In Progress, and Done.',
      icon: 'check_circle',
      type: 'material' as const,
      iconColor: '#2e7d32',
      iconBgColor: '#e8f5e9',
    },
  ];

  roleHighlights = [
    {
      title: 'Project Managers',
      p: 'Plan sprints, assign tasks, and monitor progress in real time.',
      icon: 'leaderboard',
      type: 'material' as const,
      iconColor: '#9b5cf7',
      iconBgColor: '#f3e5f5',
    },
    {
      title: 'Developers',
      p: 'Track tasks effortlessly with clear visibility and integrations.',
      icon: 'code',
      type: 'material' as const,
      iconColor: '#0288d1',
      iconBgColor: '#e1f5fe',
    },
    {
      title: 'Designers',
      p: 'Collaborate visually and keep creative assets organized.',
      icon: 'brush',
      type: 'material' as const,
      iconColor: '#ec407a',
      iconBgColor: '#fce4ec',
    },
    {
      title: 'Teams',
      p: 'Stay aligned, communicate clearly, and move projects forward together.',
      icon: 'groups',
      type: 'material' as const,
      iconColor: '#2e7d32',
      iconBgColor: '#e8f5e9',
    },
  ];

  trustedCompany = ['NovaWorks', 'SkyLogic', 'PixelForge', 'NextVision', 'CloudAxis'];
}
