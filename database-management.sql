-- Supabase 数据库管理脚本
-- 用于查看和管理用户数据隔离系统

-- 1. 查看所有用户及其档案信息
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created,
    p.display_name,
    p.last_login,
    p.login_count,
    s.total_tasks,
    s.completed_tasks,
    s.overdue_tasks,
    st.email_notifications,
    st.theme,
    st.language
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
LEFT JOIN public.user_stats s ON u.id = s.user_id
LEFT JOIN public.user_settings st ON u.id = st.user_id
ORDER BY u.created_at DESC;

-- 2. 查看用户登录记录
SELECT 
    u.email,
    l.login_at,
    l.ip_address,
    l.login_method,
    l.success
FROM public.user_login_logs l
JOIN auth.users u ON l.user_id = u.id
ORDER BY l.login_at DESC
LIMIT 50;

-- 3. 查看用户活动记录
SELECT 
    u.email,
    a.activity_type,
    a.activity_data,
    a.created_at
FROM public.user_activities a
JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 50;

-- 4. 查看用户任务统计
SELECT 
    u.email,
    COUNT(t.id) as total_tasks,
    COUNT(t.id) FILTER (WHERE t.completed = true) as completed_tasks,
    COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.completed = false) as overdue_tasks,
    ROUND((COUNT(t.id) FILTER (WHERE t.completed = true) * 100.0 / NULLIF(COUNT(t.id), 0)), 2) as completion_rate
FROM auth.users u
LEFT JOIN public.todos t ON u.id = t.user_id
GROUP BY u.id, u.email
ORDER BY total_tasks DESC;

-- 5. 查看用户设置
SELECT 
    u.email,
    st.email_notifications,
    st.push_notifications,
    st.default_priority,
    st.theme,
    st.language,
    st.timezone,
    st.updated_at
FROM public.user_settings st
JOIN auth.users u ON st.user_id = u.id
ORDER BY st.updated_at DESC;

-- 6. 查看用户任务优先级分布
SELECT 
    u.email,
    t.priority,
    COUNT(t.id) as task_count
FROM auth.users u
JOIN public.todos t ON u.id = t.user_id
GROUP BY u.id, u.email, t.priority
ORDER BY u.email, t.priority;

-- 7. 查看最近7天的用户活跃度
SELECT 
    u.email,
    DATE(a.created_at) as activity_date,
    COUNT(a.id) as activity_count
FROM public.user_activities a
JOIN auth.users u ON a.user_id = u.id
WHERE a.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY u.email, DATE(a.created_at)
ORDER BY activity_date DESC, activity_count DESC;

-- 8. 查看用户注册趋势（按天统计）
SELECT 
    DATE(u.created_at) as registration_date,
    COUNT(u.id) as new_users
FROM auth.users u
GROUP BY DATE(u.created_at)
ORDER BY registration_date DESC;

-- 9. 查看用户登录频率分析
SELECT 
    u.email,
    COUNT(l.id) as total_logins,
    COUNT(DISTINCT DATE(l.login_at)) as unique_login_days,
    ROUND(COUNT(l.id) * 1.0 / NULLIF(COUNT(DISTINCT DATE(l.login_at)), 0), 2) as avg_logins_per_day
FROM auth.users u
LEFT JOIN public.user_login_logs l ON u.id = l.user_id
GROUP BY u.id, u.email
HAVING COUNT(l.id) > 0
ORDER BY total_logins DESC;

-- 10. 查看用户数据完整性
SELECT 
    u.email,
    CASE WHEN p.user_id IS NOT NULL THEN '✓' ELSE '✗' END as has_profile,
    CASE WHEN s.user_id IS NOT NULL THEN '✓' ELSE '✗' END as has_stats,
    CASE WHEN st.user_id IS NOT NULL THEN '✓' ELSE '✗' END as has_settings,
    CASE WHEN COUNT(t.id) > 0 THEN '✓' ELSE '✗' END as has_tasks
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
LEFT JOIN public.user_stats s ON u.id = s.user_id
LEFT JOIN public.user_settings st ON u.id = st.user_id
LEFT JOIN public.todos t ON u.id = t.user_id
GROUP BY u.id, u.email, p.user_id, s.user_id, st.user_id
ORDER BY u.created_at DESC;