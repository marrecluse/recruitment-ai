import { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress, Button } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, AreaChart, Area, Cell,
} from 'recharts';
import WorkOutlineIcon        from '@mui/icons-material/WorkOutline';
import PeopleOutlineIcon      from '@mui/icons-material/PeopleOutline';
import TrendingUpIcon         from '@mui/icons-material/TrendingUp';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AutoAwesomeIcon        from '@mui/icons-material/AutoAwesome';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import api        from '../services/api';
import Layout     from '../components/layout/Layout';
import StatCard   from '../components/dashboard/StatCard';

const STAGE_COLORS = {
  applied:'#818CF8', reviewed:'#60A5FA', interview:'#F59E0B',
  offer:'#10B981',   hired:'#059669',    rejected:'#EF4444',
};
const SCORE_COLORS  = ['#EF4444','#F59E0B','#FBBF24','#34D399','#10B981'];
const JOB_GRADIENT  = ['#4F46E5','#6366F1','#818CF8','#A5B4FC','#C7D2FE'];

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      background:'#0F172A', border:'1px solid rgba(255,255,255,0.1)',
      borderRadius:1.5, px:1.5, py:1, boxShadow:'0 4px 20px rgba(0,0,0,0.4)',
    }}>
      {label && <Typography sx={{ fontSize:10, color:'rgba(255,255,255,0.4)', mb:0.4 }}>{label}</Typography>}
      {payload.map((p, i) => (
        <Typography key={i} sx={{ fontSize:12, fontWeight:700, color: p.color || '#fff' }}>
          {p.value} <span style={{ fontWeight:400, opacity:0.6 }}>{p.name}</span>
        </Typography>
      ))}
    </Box>
  );
}

function ChartCard({ title, sub, children, height = 230, accent }) {
  return (
    <Box sx={{
      background:'#fff', borderRadius:3, p:2.5,
      border:'1px solid rgba(0,0,0,0.07)',
      boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
      height:'100%',
    }}>
      <Box sx={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', mb:0.5 }}>
        <Box>
          <Typography sx={{ fontWeight:700, fontSize:14, color:'#0F172A' }}>{title}</Typography>
          {sub && <Typography sx={{ fontSize:11, color:'#94A3B8', mt:0.2 }}>{sub}</Typography>}
        </Box>
        {accent && (
          <Box sx={{
            px:1, py:0.3, borderRadius:1, fontSize:10, fontWeight:700,
            background: accent.bg, color: accent.color,
          }}>{accent.label}</Box>
        )}
      </Box>
      <Box sx={{ height, mt:1.5 }}>{children}</Box>
    </Box>
  );
}

function Empty({ text = 'No data yet' }) {
  return (
    <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:1 }}>
      <AutoAwesomeIcon sx={{ fontSize:32, color:'#E2E8F0' }} />
      <Typography sx={{ fontSize:12, color:'#CBD5E1' }}>{text}</Typography>
    </Box>
  );
}

function SkillBar({ skill, count, max, color }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1 }}>
      <Typography sx={{
        fontSize:11, color:'#64748B', width:80, flexShrink:0,
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
      }}>
        {skill}
      </Typography>
      <Box sx={{ flex:1, height:8, borderRadius:4, background:'#F1F5F9', overflow:'hidden' }}>
        <Box sx={{
          height:'100%', borderRadius:4, width:`${pct}%`,
          background: color, transition:'width 0.6s ease',
        }} />
      </Box>
      <Typography sx={{ fontSize:11, fontWeight:700, color:'#64748B', width:20, textAlign:'right', flexShrink:0 }}>
        {count}
      </Typography>
    </Box>
  );
}

export default function RecruiterAnalyticsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get('/analytics/recruiter')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', gap:2 }}>
        <CircularProgress size={28} sx={{ color:'#4F46E5' }} />
        <Typography sx={{ color:'#64748B', fontSize:14 }}>Loading analytics…</Typography>
      </Box>
    </Layout>
  );
  if (error) return (
    <Layout>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
        <Typography sx={{ color:'#EF4444', fontSize:14 }}>{error}</Typography>
      </Box>
    </Layout>
  );

  const s = data?.summary || {};

  // Controller sends: stageDistribution[].stage + .count
  const stageData = (data?.stageDistribution || []).map(d => ({
    stage: d.stage ? d.stage.charAt(0).toUpperCase() + d.stage.slice(1) : 'Unknown',
    count: d.count,
    fill:  STAGE_COLORS[d.stage] || '#94A3B8',
  }));

  // Controller sends: scoreDistribution[].range + .candidates
  const scoreData = (data?.scoreDistribution || []).map((d, i) => ({
    range: d.range,
    count: d.candidates,
    fill:  SCORE_COLORS[i] || '#818CF8',
  }));

  // Controller sends: appsOverTime[].date + .count
  const appsOverTime = (data?.appsOverTime || []).map(d => ({
    date: d.date,
    apps: d.count,
  }));

  // Controller sends: appsByJob[].name + .applications
  const appsByJob = (data?.appsByJob || []).map((d, i) => ({
    job:   d.name || 'Untitled',
    count: d.applications,
    fill:  JOB_GRADIENT[i % JOB_GRADIENT.length],
  }));

  // Controller sends: topJobSkills[].skill + .count
  const topJobSkills  = data?.topJobSkills       || [];
  const topCandSkills = data?.topCandidateSkills || [];
  const maxJobSkill   = topJobSkills[0]?.count  || 1;
  const maxCandSkill  = topCandSkills[0]?.count || 1;

  const exportCSV = () => {
    const sections = [];
    // Summary
    sections.push(['Summary']);
    sections.push(['Total Jobs', s.totalJobs ?? 0]);
    sections.push(['Applications', s.totalApplications ?? 0]);
    sections.push(['Candidates', s.totalCandidates ?? 0]);
    sections.push(['Avg Match Score (%)', s.avgMatchScore != null ? Math.round(s.avgMatchScore) : 0]);
    sections.push([]);
    // Stage distribution
    sections.push(['Pipeline Stages', 'Count']);
    stageData.forEach(d => sections.push([d.stage, d.count]));
    sections.push([]);
    // Apps per job
    sections.push(['Job Title', 'Applications']);
    appsByJob.forEach(d => sections.push([d.job, d.count]));
    sections.push([]);
    // Top job skills
    sections.push(['Top Job Skills', 'Count']);
    topJobSkills.forEach(sk => sections.push([sk.skill, sk.count]));
    sections.push([]);
    // Top candidate skills
    sections.push(['Top Candidate Skills', 'Count']);
    topCandSkills.forEach(sk => sections.push([sk.skill, sk.count]));

    const csv = sections.map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'analytics.csv';
    a.click();
  };

  return (
    <Layout>
      <Box sx={{ p: { xs:2, md:3 }, maxWidth:1200, mx:'auto' }}>

        <Box sx={{ mb:3, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:1 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight:800, color:'#0F172A', letterSpacing:-0.5 }}>
              Analytics
            </Typography>
            <Typography sx={{ fontSize:13, color:'#94A3B8', mt:0.4 }}>
              Overview of your hiring pipeline and activity
            </Typography>
          </Box>
          <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />}
            onClick={exportCSV}
            sx={{ textTransform:'none', fontWeight:600, borderRadius:2, fontSize:12,
              borderColor:'#C7D2FE', color:'#4F46E5',
              '&:hover': { background:'#EEF2FF' } }}>
            Export CSV
          </Button>
        </Box>

        {/* Stat cards — StatCard uses `label` prop, not `title` */}
        <Grid container spacing={2} sx={{ mb:3 }}>
          {[
            { label:'Total Jobs',      value: s.totalJobs         ?? 0, icon:<WorkOutlineIcon />,        color:'#4F46E5' },
            { label:'Applications',    value: s.totalApplications ?? 0, icon:<AssignmentOutlinedIcon />, color:'#0EA5E9' },
            { label:'Candidates',      value: s.totalCandidates   ?? 0, icon:<PeopleOutlineIcon />,      color:'#10B981' },
            { label:'Avg Match Score', value: s.avgMatchScore != null
                ? `${Math.round(s.avgMatchScore)}%` : '—',
              icon:<TrendingUpIcon />, color:'#F59E0B' },
          ].map(card => (
            <Grid item xs={12} sm={6} md={3} key={card.label}>
              <StatCard
                label={card.label}
                value={card.value}
                icon={card.icon}
                color={card.color}
              />
            </Grid>
          ))}
        </Grid>

        {/* Row 1: Applications over time + Pipeline stages */}
        <Grid container spacing={2} sx={{ mb:2 }}>
          <Grid item xs={12} md={8}>
            <ChartCard
              title="Applications Over Time"
              sub="Last 14 days"
              height={200}
              accent={{ label:'14d', bg:'#EEF2FF', color:'#4F46E5' }}
            >
              {!appsOverTime.some(d => d.apps > 0) ? <Empty /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={appsOverTime} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                    <defs>
                      <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RTooltip content={<DarkTooltip />} />
                    <Area type="monotone" dataKey="apps" name="applications"
                      stroke="#4F46E5" strokeWidth={2.5}
                      fill="url(#appGrad)" dot={false} activeDot={{ r:4, fill:'#4F46E5' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <ChartCard title="Pipeline Stages" sub="All applications" height={200}>
              {!stageData.length ? <Empty /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} layout="vertical" margin={{ top:0, right:8, left:4, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="stage" tick={{ fontSize:11, fill:'#64748B' }} tickLine={false} axisLine={false} width={68} />
                    <RTooltip content={<DarkTooltip />} cursor={{ fill:'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="count" name="candidates" radius={[0,4,4,0]} barSize={14}>
                      {stageData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </Grid>
        </Grid>

        {/* Row 2: Apps per job + Score distribution */}
        <Grid container spacing={2} sx={{ mb:2 }}>
          <Grid item xs={12} md={7}>
            <ChartCard title="Applications per Job" sub="Top positions" height={210}>
              {!appsByJob.length ? <Empty /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appsByJob} margin={{ top:4, right:8, left:-20, bottom:40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="job"
                      tick={{ fontSize:10, fill:'#64748B', angle:-30, textAnchor:'end' }}
                      tickLine={false} axisLine={false} interval={0} />
                    <YAxis tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RTooltip content={<DarkTooltip />} cursor={{ fill:'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="count" name="applications" radius={[6,6,0,0]} barSize={28}>
                      {appsByJob.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={5}>
            <ChartCard title="Match Score Distribution" sub="All matched candidates" height={210}>
              {!scoreData.some(d => d.count > 0) ? <Empty /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize:10, fill:'#64748B' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize:10, fill:'#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RTooltip content={<DarkTooltip />} cursor={{ fill:'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="count" name="candidates" radius={[6,6,0,0]} barSize={32}>
                      {scoreData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </Grid>
        </Grid>

        {/* Row 3: Top job skills + Top candidate skills */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <ChartCard title="Top Skills in Job Postings" sub="Most requested across all your jobs" height={220}>
              {!topJobSkills.length ? <Empty text="Post jobs with skills to see data" /> : (
                <Box sx={{ pt:1 }}>
                  {topJobSkills.slice(0, 8).map((sk, i) => (
                    <SkillBar key={sk.skill} skill={sk.skill} count={sk.count}
                      max={maxJobSkill} color={JOB_GRADIENT[i % JOB_GRADIENT.length]} />
                  ))}
                </Box>
              )}
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ChartCard title="Top Candidate Skills" sub="Most common across all applicants" height={220}>
              {!topCandSkills.length ? <Empty text="Awaiting candidate applications" /> : (
                <Box sx={{ pt:1 }}>
                  {topCandSkills.slice(0, 8).map((sk, i) => (
                    <SkillBar key={sk.skill} skill={sk.skill} count={sk.count}
                      max={maxCandSkill} color={SCORE_COLORS[i % SCORE_COLORS.length]} />
                  ))}
                </Box>
              )}
            </ChartCard>
          </Grid>
        </Grid>

      </Box>
    </Layout>
  );
}
