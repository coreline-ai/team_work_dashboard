"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { statusDistribution } from "@/data/mock-data"

export function StatusPieChart() {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle className="text-base">상태별 분포</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                        >
                            {statusDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
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
                            verticalAlign="bottom"
                            wrapperStyle={{ fontSize: "13px", paddingTop: "16px" }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
