import { Modal, Form, Input, InputNumber, Select, message } from "antd";
import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../api/admin.service";

const { TextArea } = Input;

function CourseModal({ isOpen, onClose, onSuccess, courseId = null, mode = "add" }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const isEditMode = mode === "edit" || courseId !== null;
  const modalTitle = isEditMode ? "Edit Course" : "Add New Course";
  const submitButtonText = isEditMode ? "Update Course" : "Add Course";
  const loadingText = isEditMode ? "Updating..." : "Adding...";

  const fetchCourseData = useCallback(async () => {
    setFetchingData(true);
    try {
      const result = await adminService.getCourseById(courseId);
      if (result.success) {
        const formData = {
          course_name: result.data.course_name,
          instructor: result.data.instructor,
          price: result.data.price,
          description: result.data.description,
          topic: result.data.topic,
          difficulty: result.data.difficulty,
          duration: result.data.duration,
          learningObjectives: result.data.learningObjectives,
          y_link: result.data.y_link,
          p_link: result.data.p_link,
        };
        form.setFieldsValue(formData);
      } else {
        message.error(result.error);
        onClose();
      }
    } catch {
      message.error("Failed to fetch course data");
      onClose();
    } finally {
      setFetchingData(false);
    }
  }, [courseId, form, onClose]);

  useEffect(() => {
    if (isOpen && isEditMode && courseId) {
      fetchCourseData();
    } else if (isOpen && !isEditMode) {
      form.resetFields();
    }
  }, [isOpen, courseId, isEditMode, fetchCourseData, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let result;
      if (isEditMode) {
        const editData = {
          course_name: values.course_name,
          instructor: values.instructor,
          price: values.price,
          description: values.description,
          topic: values.topic,
          difficulty: values.difficulty,
          duration: values.duration,
          learningObjectives: values.learningObjectives,
          y_link: values.y_link,
          p_link: values.p_link,
        };
        result = await adminService.updateCourse(courseId, editData);
      } else {
        const addData = {
          course_name: values.course_name,
          instructor: values.instructor,
          price: values.price,
          description: values.description,
          topic: values.topic,
          difficulty: values.difficulty,
          duration: values.duration,
          learningObjectives: values.learningObjectives,
          y_link: values.y_link,
          p_link: values.p_link,
        };
        result = await adminService.createCourse(addData);
      }

      if (result.success) {
        message.success(isEditMode ? "Course updated successfully!" : "Course added successfully!");
        form.resetFields();
        onClose();
        onSuccess?.();
      } else {
        message.error(result.error);
      }
    } catch {
      message.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={modalTitle}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={600}
      className="custom-modal"
      destroyOnClose
    >
      {fetchingData ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <span className="ml-3 text-gray-600">Loading course data...</span>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-2 space-y-4"
          initialValues={{
            course_name: "",
            instructor: "",
            price: 0,
            description: "",
            topic: "",
            difficulty: "Beginner",
            duration: "",
            learningObjectives: "",
            y_link: "",
            p_link: "",
          }}
        >
          <Form.Item
            label="Course Name"
            name="course_name"
            rules={[
              { required: true, message: "Course name is required" },
              { min: 3, message: "Course name must be at least 3 characters" },
              { max: 100, message: "Course name cannot exceed 100 characters" },
            ]}
          >
            <Input placeholder="Enter course name" />
          </Form.Item>

          <Form.Item label="Estimated duration" name="duration" rules={[{ max: 100, message: "Duration cannot exceed 100 characters" }]}>
            <Input placeholder="e.g. 6 weeks · 18 hours" />
          </Form.Item>

          <Form.Item label="Learning objectives" name="learningObjectives" rules={[{ max: 2000, message: "Objectives cannot exceed 2000 characters" }]}>
            <TextArea rows={3} placeholder="What learners will be able to do after completing this course" showCount maxLength={2000} />
          </Form.Item>

          <Form.Item
            label="Topic"
            name="topic"
            rules={[
              { required: true, message: "Course topic is required" },
              { max: 100, message: "Topic cannot exceed 100 characters" },
            ]}
          >
            <Input placeholder="e.g. Web Development" />
          </Form.Item>

          <Form.Item
            label="Difficulty"
            name="difficulty"
            rules={[{ required: true, message: "Select a difficulty level" }]}
          >
            <Select
              options={[
                { value: "Beginner", label: "Beginner" },
                { value: "Intermediate", label: "Intermediate" },
                { value: "Advanced", label: "Advanced" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Instructor"
            name="instructor"
            rules={[
              { required: true, message: "Instructor is required" },
              { min: 2, message: "Instructor name must be at least 2 characters" },
            ]}
          >
            <Input placeholder="Enter instructor name" />
          </Form.Item>

          <Form.Item
            label="Price"
            name="price"
            rules={[
              { required: true, message: "Price is required" },
              { type: "number", min: 0, message: "Price must be a positive number" },
            ]}
          >
            <InputNumber
              placeholder="Enter price"
              className="w-full"
              min={0}
              step={0.01}
              formatter={(value) =>
                `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: "Description is required" },
              { min: 10, message: "Description must be at least 10 characters" },
              { max: 500, message: "Description cannot exceed 500 characters" },
            ]}
          >
            <TextArea rows={4} placeholder="Enter course description" showCount maxLength={500} />
          </Form.Item>

          <Form.Item
            label="Video Link"
            name="y_link"
            rules={[{ type: "url", message: "Please enter a valid URL" }]}
          >
            <Input placeholder="Optional for courses using modules and lessons" />
          </Form.Item>

          <Form.Item
            label="Image Link"
            name="p_link"
            rules={[{ type: "url", message: "Please enter a valid URL" }]}
          >
            <Input placeholder="Optional course thumbnail URL" />
          </Form.Item>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium min-w-[140px] flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {loadingText}
                </>
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </Form>
      )}
    </Modal>
  );
}

export default CourseModal;
