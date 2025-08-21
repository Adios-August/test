import React from "react";
import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useNavigate, useLocation } from "react-router-dom";
import { authStore } from "../../stores";
import "./Login.scss";

const Login = observer(() => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const onFinish = async (values) => {
    try {
      const result = await authStore.login(values.username, values.password);
     
      
      if (result.success) {
        message.success("Login success!");
        // 登录成功后跳转到用户原来要访问的页面，如果没有则跳转到首页
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
  
      } else {
        message.error(result.error || "Invalid username or password!");
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error("Login failed, please try again later");
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-content">
          <Card className="login-card" bordered={false}>
            <div className="login-header">
              <p className="login-subtitle">Sign in to your account</p>
            </div>
            
            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: "Please enter username!" },
                  { min: 3, message: "Username must be at least 3 characters!" }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter username"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Please enter password!" },
                  { min: 6, message: "Password must be at least 6 characters!" }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter password"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="login-button"
                  loading={authStore.loading}
                  block
                >
                  {authStore.loading ? "Signing in..." : "Sign In"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
});

export default Login; 