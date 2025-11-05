import { Component } from '@angular/core';
import { Header } from '../../components/header/header';
import { Card } from '../../components/card/card';
import { LinkButton } from '../../components/link-button/link-button';

@Component({
  selector: 'app-features-page',
  imports: [Header, Card, LinkButton],
  templateUrl: './features-page.html',
  styleUrl: './features-page.css',
  standalone: true,
})
export class FeaturesPage {
  features = [
    {
      title: 'Kanban Boards',
      p: 'Visualize your projects with simple, customizable boards for To Do, In Progress, and Done.',
      icon: 'view_kanban',
      type: 'material' as const,
      iconColor: '#9b5cf7',
      iconBgColor: '#f3e5f5',
    },
    {
      title: 'Team Collaboration',
      p: 'Work together in real-time with comments, mentions, and shared updates that keep everyone aligned.',
      icon: 'groups',
      type: 'material' as const,
      iconColor: '#0288d1',
      iconBgColor: '#e1f5fe',
    },
    {
      title: 'Task Management',
      p: 'Create, assign, and track tasks effortlessly with deadlines, priorities, and labels.',
      icon: 'check_circle',
      type: 'material' as const,
      iconColor: '#2e7d32',
      iconBgColor: '#e8f5e9',
    },
    {
      title: 'Notifications',
      p: 'Stay up to date with smart alerts for task updates, mentions, and board activities.',
      icon: 'notifications_active',
      type: 'material' as const,
      iconColor: '#3949ab',
      iconBgColor: '#e8eaf6',
    },
    {
      title: 'Built-in Chat',
      p: 'Communicate instantly with your team without switching tools — everything stays in context.',
      icon: 'chat',
      type: 'material' as const,
      iconColor: '#ec407a',
      iconBgColor: '#fce4ec',
    },
    {
      title: 'Analytics Dashboard',
      p: 'Track productivity, monitor progress, and get visual insights into team performance.',
      icon: 'analytics',
      type: 'material' as const,
      iconColor: '#f57c00',
      iconBgColor: '#fff3e0',
    },
    {
      title: 'Custom Workspaces',
      p: 'Organize projects by teams or departments and control member access with ease.',
      icon: 'workspaces',
      type: 'material' as const,
      iconColor: '#6a1b9a',
      iconBgColor: '#f3e5f5',
    },
    {
      title: 'Responsive Design',
      p: 'Access your boards anywhere — fully optimized for desktop, tablet, and mobile devices.',
      icon: 'devices',
      type: 'material' as const,
      iconColor: '#00796b',
      iconBgColor: '#e0f2f1',
    },
  ];

  loveTavoloFeatures = [
    {
      title: '10x Faster',
      p: 'Ship projects in days, not weeks. Our streamlined workflows eliminate bottlenecks and accelerate delivery.',
      icon: 'speed',
      type: 'material' as const,
      iconColor: '#f57c00',
      iconBgColor: '#fff3e0',
    },
    {
      title: 'Enterprise Ready',
      p: 'Experience bank-level security with SSO, 2FA, and compliance certifications built for modern teams.',
      icon: 'security',
      type: 'material' as const,
      iconColor: '#3949ab',
      iconBgColor: '#e8eaf6',
    },
    {
      title: 'Save 20hrs/Week',
      p: 'Reduce meetings and status updates with real-time visibility into your team’s work and progress.',
      icon: 'schedule',
      type: 'material' as const,
      iconColor: '#2e7d32',
      iconBgColor: '#e8f5e9',
    },
  ];
  test = [
    {
      title: 'Ready to Ship Faster?',
      p: 'Join thousands of teams already building better products with Tavolo.',
      icon: '',
      type: 'material' as const,
      iconColor: '#9c27b0',
      iconBgColor: '#f3e5f5',
    },
  ];
}
