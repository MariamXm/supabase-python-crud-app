import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import "./styles/dashboard.css";

export default function Dashboard({ user }) {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [editId, setEditId] = useState(null);
  const [newName, setNewName] = useState("");
  const [newFile, setNewFile] = useState(null);

  
  const fetchFiles = useCallback(async () => {
    const { data, error } = await supabase
      .from("files_metadata")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.log("Fetch files error:", error);
      return;
    }
    setFiles(data);
  }, [user.id]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const upload = async () => {
    if (!file) return;

    const filePath = `uploads/${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (error) {
      alert("Upload failed: " + error.message);
      return;
    }
    const { error: dbError } = await supabase.from("files_metadata").insert({
      filename: file.name,
      file_path: filePath,
      file_type: file.type,
      uploaded_by: user.email,
      user_id: user.id,
    });

    if (dbError) {
      alert("DB insert failed: " + dbError.message);
      return;
    }
    fetchFiles();
  };

  const download = async (file) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(file.file_path, 60);
    if (error) {
      console.log("Download error:", error);
      return;
    }
    window.open(data.signedUrl);
  };

  const remove = async (file) => {
    const { error } = await supabase.storage
      .from("documents")
      .remove([file.file_path]);
    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }
    const { error: dbError } = await supabase
      .from("files_metadata")
      .delete()
      .eq("id", file.id);

    if (dbError) {
      alert("DB delete failed: " + dbError.message);
      return;
    }
    fetchFiles();
  };

  // Update Function 
  const update = async (existingFile) => {
    // Update only metadata if no new file is selected
    if (!newFile) {
      const { error } = await supabase
        .from("files_metadata")
        .update({ filename: newName })
        .eq("id", existingFile.id);

      if (error) {
        alert("Update failed: " + error.message);
        return;
      }

      cancelEdit();
      fetchFiles();
      return;
    }

    // Replace file if new file is selected

    // 1. Delete old file
    const { error: deleteError } = await supabase.storage
      .from("documents")
      .remove([existingFile.file_path]);

    if (deleteError) {
      alert("Delete old file failed: " + deleteError.message);
      return;
    }

    // 2. Upload new file in uploads folder
    const newPath = `uploads/${user.id}/${Date.now()}_${newFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(newPath, newFile);

    if (uploadError) {
      alert("Replace failed: " + uploadError.message);
      return;
    }

    // 3. Update metadata with new file details
    const { error: dbError } = await supabase
      .from("files_metadata")
      .update({
        filename: newName || newFile.name,
        file_path: newPath,
        file_type: newFile.type,
      })
      .eq("id", existingFile.id);

    if (dbError) {
      alert("DB update failed: " + dbError.message);
      return;
    }

    cancelEdit();
    fetchFiles();
  };

  const startEdit = (file) => {
    setEditId(file.id);
    setNewName(file.filename);
    setNewFile(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setNewName("");
    setNewFile(null);
  };

  // LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h3>Welcome, {user.email}</h3>
        <button onClick={logout}>Logout</button>
      </div>

      <div className="dashboard__upload">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={upload}>Upload</button>
      </div>

      <div className="dashboard__divider" />

      <div>
        {files.map((f) => (
          <div className="file-card" key={f.id}>
            {editId === f.id ? (
              <div className="edit-box">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <div>
                  <button onClick={() => update(f)}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </div>

                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files[0])}
                />
              </div>
            ) : (
              <>
                <div className="file-card__name">{f.filename}</div>
                <div className="file-card__actions">
                  <button onClick={() => download(f)}>Download</button>
                  <button onClick={() => startEdit(f)}>Update</button>
                  <button onClick={() => remove(f)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
