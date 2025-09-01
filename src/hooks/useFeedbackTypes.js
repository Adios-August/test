import { useState, useEffect } from "react";
import { feedbackAPI } from "../api/feedback";

export const useFeedbackTypes = () => {
  const [feedbackTypes, setFeedbackTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeedbackTypes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await feedbackAPI.getFeedbackTypes();
      if (response.code === 200) {
        // 将API返回的 {code, description} 格式转换为 Antd Select 需要的 {value, label} 格式
        const formattedTypes = (response.data || []).map((item) => ({
          value: item.code,
          label: item.description,
        }));
        setFeedbackTypes(formattedTypes);
      } else {
        setError(response.message || "获取反馈类型失败");
      }
    } catch (err) {
      console.error("获取反馈类型失败:", err);
      setError("获取反馈类型失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackTypes();
  }, []);

  return {
    feedbackTypes,
    loading,
    error,
    refetch: fetchFeedbackTypes,
  };
};
