import { Component } from '@angular/core';
import { Header } from '../../components/header/header';
import { StatsComponent } from '../../components/stats/stats';
import { Card } from '../../components/card/card';
import { LinkButton } from '../../components/link-button/link-button';

@Component({
  selector: 'app-about-page',
  imports: [Header, StatsComponent, Card, LinkButton],
  templateUrl: './about-page.html',
  styleUrl: './about-page.css',
})
export class AboutPage {
  ourValues = [
    {
      title: 'Mission Driven',
      p: "We're on a mission to make project management delightful for every team, everywhere.",
      icon: 'flag',
      type: 'material' as const,
      iconColor: '#9b5cf7',
      iconBgColor: '#f3e5f5',
    },
    {
      title: 'People First',
      p: 'Technology should serve people, not the other way around. We design with empathy.',
      icon: 'diversity_3',
      type: 'material' as const,
      iconColor: '#0288d1',
      iconBgColor: '#e1f5fe',
    },
    {
      title: 'Move Fast',
      p: 'Speed matters. We ship quickly, iterate constantly, and learn from our users.',
      icon: 'bolt',
      type: 'material' as const,
      iconColor: '#f57c00',
      iconBgColor: '#fff3e0',
    },
    {
      title: 'Excellence',
      p: "We're committed to building the best product possible, one release at a time.",
      icon: 'military_tech',
      type: 'material' as const,
      iconColor: '#2e7d32',
      iconBgColor: '#e8f5e9',
    },
  ];
  ourTeam = [
    {
      title: 'Karim Al-Sayed',
      p: 'Founder & CEO — Visionary leader focused on empowering teams to collaborate smarter and move faster.',
      icon: 'account_circle',
      type: 'material' as const,
      iconColor: '#9b5cf7',
      iconBgColor: '#f3e5f5',
    },
    {
      title: 'Sara Lindström',
      p: 'Head of Design — Passionate about creating user experiences that are both powerful and intuitive.',
      icon: 'brush',
      type: 'material' as const,
      iconColor: '#0288d1',
      iconBgColor: '#e1f5fe',
    },
    {
      title: 'Alex Chen',
      p: 'CTO — Leads the engineering team, ensuring Tavolo’s platform is scalable, fast, and secure.',
      icon: 'memory',
      type: 'material' as const,
      iconColor: '#f57c00',
      iconBgColor: '#fff3e0',
    },
    {
      title: 'Maria González',
      p: 'Head of Operations — Keeps everything running smoothly, from product launches to customer success.',
      icon: 'groups',
      type: 'material' as const,
      iconColor: '#2e7d32',
      iconBgColor: '#e8f5e9',
    },
  ];

  test = [
    {
      title: 'Want to Join Our Mission?',
      p: ' We are always looking for talented people who share our passion for building great products.',
      icon: '',
      type: 'material' as const,
      iconColor: '#9c27b0',
      iconBgColor: '#f3e5f5',
    },
  ];
}
