import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { TransactionService } from "../services/transaction.service.js";
import { Transaction } from "../models/Transaction.js";

export class TransactionController {
  static async getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { page, limit, search, category, type, startDate, endDate, sortBy, sortOrder } = req.query as any;

    const result = await TransactionService.getTransactions(req.userId!, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      category,
      type,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  }

  static async createTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const tx = await TransactionService.createTransaction(req.userId!, req.body);
    res.status(201).json({
      status: "success",
      message: "Transaction added successfully.",
      data: { transaction: tx },
    });
  }

  static async parseNaturalLanguage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const text = req.body.text;
    const parsed = TransactionService.parseNaturalLanguage(text);

    // If autoSave flag is set, create the transaction directly
    if (req.body.autoSave) {
      const created = await TransactionService.createTransaction(req.userId!, parsed);
      res.status(201).json({
        status: "success",
        message: "Transaction parsed and saved successfully.",
        data: { parsed, transaction: created },
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: { parsed },
    });
  }

  static async updateTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const updated = await TransactionService.updateTransaction(req.userId!, req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ status: "error", message: "Transaction not found." });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Transaction updated.",
      data: { transaction: updated },
    });
  }

  static async deleteTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const success = await TransactionService.deleteTransaction(req.userId!, req.params.id);
    if (!success) {
      res.status(404).json({ status: "error", message: "Transaction not found." });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Transaction deleted.",
    });
  }

  static async exportTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const format = req.query.format === "json" ? "json" : "csv";
    const txs = await Transaction.find({ userId: req.userId }).sort({ date: -1 }).lean();

    if (format === "json") {
      res.setHeader("Content-Disposition", `attachment; filename=transactions-${Date.now()}.json`);
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(txs, null, 2));
      return;
    }

    // CSV format
    const headers = ["Date", "Type", "Category", "Amount", "Merchant", "Description", "Nature", "Payment Method"];
    const rows = txs.map((t) => [
      new Date(t.date).toISOString().split("T")[0],
      t.type,
      `"${t.category}"`,
      t.amount,
      `"${t.merchant || ""}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      t.nature,
      t.paymentMethod || "UPI",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    res.setHeader("Content-Disposition", `attachment; filename=fintwin-transactions-${Date.now()}.csv`);
    res.setHeader("Content-Type", "text/csv");
    res.send(csvContent);
  }
}
