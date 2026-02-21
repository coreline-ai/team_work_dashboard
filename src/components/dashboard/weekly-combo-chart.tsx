"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Line,
    ComposedChart,
    Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { weeklyData } from "@/data/mock-data"

export function WeeklyComboChart() {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle className="text-base">주간 리소스 & 진행률</CardTitle>
                <CardDescription>주간 계획 대비 완료 현황 및 리소스 사용률</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={weeklyData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "white",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                fontSize: "13px",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                        />
                        <Legend
                            verticalAlign="top"
                            height={36}
                            wrapperStyle={{ fontSize: "13px" }}
                        />
                        <Bar yAxisId="left" dataKey="planned" name="계획" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar yAxisId="left" dataKey="completed" name="완료" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                        <Line yAxisId="right" type="monotone" dataKey="resource" name="리소스 사용률" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
